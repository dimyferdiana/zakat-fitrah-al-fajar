INSERT INTO public.users (id, email, nama_lengkap, role, is_active)
SELECT id, email, 'Admin Lokal', 'admin', true
FROM auth.users
WHERE email = 'dimyferdi@gmail.com'
ON CONFLICT (id) DO NOTHING;