import json
import os
from pathlib import Path
import urllib.request
import urllib.error


def load_env() -> None:
    env_path = Path(__file__).resolve().parent.parent / '.env'
    for line in env_path.read_text(encoding='utf-8').splitlines():
        line = line.strip()
        if not line or line.startswith('#') or '=' not in line:
            continue
        key, value = line.split('=', 1)
        os.environ[key] = value


def request_json(url: str, method: str = 'GET', payload=None, headers=None):
    final_headers = {'Content-Type': 'application/json'}
    if headers:
        final_headers.update(headers)

    data = None if payload is None else json.dumps(payload).encode()
    req = urllib.request.Request(url, data=data, headers=final_headers, method=method)

    try:
        with urllib.request.urlopen(req, timeout=30) as response:
            body = response.read().decode()
            return response.status, body
    except urllib.error.HTTPError as error:
        return error.code, error.read().decode()


def extract_json(body: str):
    try:
        return json.loads(body)
    except Exception:
        return None


def get_admin_users(base: str, service_key: str):
    return request_json(
        f'{base}/rest/v1/users?select=id,email,role,is_active&role=eq.admin',
        method='GET',
        headers={
            'apikey': service_key,
            'Authorization': f'Bearer {service_key}',
        },
    )


def patch_user(base: str, service_key: str, user_id: str, payload):
    return request_json(
        f'{base}/rest/v1/users?id=eq.{user_id}',
        method='PATCH',
        payload=payload,
        headers={
            'apikey': service_key,
            'Authorization': f'Bearer {service_key}',
            'Prefer': 'return=representation',
        },
    )


def main():
    load_env()

    base = os.environ.get('VITE_SUPABASE_URL', '').rstrip('/')
    service = os.environ.get('VITE_SUPABASE_SERVICE_ROLE_KEY', '')

    if not base or not service:
        raise RuntimeError('Missing Supabase env values in .env')

    results = {}
    deactivated_for_test = []

    s_admins, b_admins = get_admin_users(base, service)
    admins = extract_json(b_admins)
    if s_admins != 200 or not isinstance(admins, list):
        results['fetch_admins_ok'] = False
        results['raw_fetch_admins'] = (b_admins or '')[:500]
        print(json.dumps(results, indent=2))
        return
    results['fetch_admins_ok'] = True

    active_admins = [row for row in admins if row.get('is_active') is True]
    results['initial_active_admin_count'] = len(active_admins)

    if len(active_admins) == 0:
        results['blocked_by_precondition'] = 'No active admin found. Cannot run test.'
        print(json.dumps(results, indent=2))
        return

    keeper = active_admins[0]
    keeper_id = keeper.get('id')
    keeper_email = keeper.get('email')
    results['keeper_admin_email'] = keeper_email

    try:
        for row in active_admins[1:]:
            user_id = row.get('id')
            if not user_id:
                continue
            s_off, b_off = patch_user(base, service, user_id, {'is_active': False})
            if s_off in (200, 204):
                deactivated_for_test.append(user_id)
            else:
                results['setup_error'] = f'Failed to deactivate admin {user_id}: {s_off} {b_off[:200]}'
                break

        s_after_setup, b_after_setup = get_admin_users(base, service)
        admins_after_setup = extract_json(b_after_setup)
        if s_after_setup == 200 and isinstance(admins_after_setup, list):
            active_after_setup = [row for row in admins_after_setup if row.get('is_active') is True]
            results['active_admin_count_before_last_attempt'] = len(active_after_setup)
        else:
            results['active_admin_count_before_last_attempt'] = None

        if not keeper_id:
            results['last_admin_deactivate_blocked'] = False
            results['status_last_admin_attempt'] = None
            results['raw_last_admin_response'] = 'Missing keeper admin ID'
        else:
            s_deactivate_last, b_deactivate_last = patch_user(
                base,
                service,
                keeper_id,
                {'is_active': False},
            )

            body_lower = (b_deactivate_last or '').lower()
            results['last_admin_deactivate_blocked'] = (
                s_deactivate_last >= 400
                and (
                    'last active admin' in body_lower
                    or 'cannot deactivate or demote the last active admin' in body_lower
                )
            )
            results['status_last_admin_attempt'] = s_deactivate_last
            results['raw_last_admin_response'] = (b_deactivate_last or '')[:500]
    finally:
        for user_id in deactivated_for_test:
            patch_user(base, service, user_id, {'is_active': True})

    s_after_restore, b_after_restore = get_admin_users(base, service)
    admins_after_restore = extract_json(b_after_restore)
    if s_after_restore == 200 and isinstance(admins_after_restore, list):
        active_after_restore = [row for row in admins_after_restore if row.get('is_active') is True]
        results['active_admin_count_after_restore'] = len(active_after_restore)
    else:
        results['active_admin_count_after_restore'] = None

    print(json.dumps(results, indent=2))


if __name__ == '__main__':
    main()
