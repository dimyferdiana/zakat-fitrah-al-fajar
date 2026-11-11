-- Run against local test database only; all synthetic rows are rolled back.
BEGIN;
DO $$
DECLARE
  a UUID := gen_random_uuid(); p UUID := gen_random_uuid(); viewer UUID := gen_random_uuid(); customer_user UUID := gen_random_uuid(); h UUID := gen_random_uuid(); h2 UUID := gen_random_uuid(); member UUID := gen_random_uuid();
  must UUID := gen_random_uuid(); zakat UUID := gen_random_uuid(); distribusi UUID := gen_random_uuid();
  yr UUID := gen_random_uuid(); kat UUID := gen_random_uuid(); customer UUID := gen_random_uuid(); loan UUID := gen_random_uuid();
  event_id UUID := gen_random_uuid(); animal_id UUID := gen_random_uuid(); share_id UUID := gen_random_uuid();
  legacy_animal UUID := gen_random_uuid(); legacy_share UUID := gen_random_uuid();
  member_zakat UUID := gen_random_uuid(); donation UUID := gen_random_uuid(); income UUID := gen_random_uuid();
  legacy_donation UUID := gen_random_uuid(); legacy_income UUID := gen_random_uuid(); legacy_rice UUID := gen_random_uuid(); member_rice UUID := gen_random_uuid();
  payment UUID; receipt JSONB;
  nik TEXT := substr(translate(replace(gen_random_uuid()::text, '-', ''), 'abcdef', '012345'), 1, 16);
  rejected BOOLEAN := false; today DATE := (now() AT TIME ZONE 'Asia/Jakarta')::date;
BEGIN
  INSERT INTO auth.users(id,email) VALUES (a,a::text||'@example.test'),(p,p::text||'@example.test'),(viewer,viewer::text||'@example.test'),(customer_user,customer_user::text||'@example.test');
  INSERT INTO auth.sessions(id,user_id) VALUES (a,a),(p,p),(viewer,viewer),(customer_user,customer_user);
  INSERT INTO public.users(id,nama_lengkap,email,role,is_active) VALUES (a,'Petugas Uji',a::text || '@example.test','admin',true);
  INSERT INTO public.users(id,nama_lengkap,email,role,is_active) VALUES
    (p,'Petugas Uji',p::text || '@example.test','petugas',true), (viewer,'Viewer Uji',viewer::text || '@example.test','viewer',true);
  INSERT INTO public.tahun_zakat(id,tahun_hijriah,tahun_masehi,nilai_beras_kg,nilai_uang_rp)
    VALUES (yr, 'uji-' || yr::text, 4000 + floor(random()*1000000)::int, 2.5, 10000);
  INSERT INTO public.kategori_mustahik(id,nama) VALUES (kat,'uji-' || kat::text);
  INSERT INTO public.muzakki(id,nama_kk,alamat,no_telp,nik) VALUES (h,'Nama Sama','Alamat Uji','0800000000',nik);
  INSERT INTO public.muzakki(id,nama_kk,alamat,no_telp) VALUES (h2,'Nama Sama','Alamat Uji','0800000000');
  BEGIN
    INSERT INTO public.muzakki(nama_kk,alamat,nik) VALUES ('NIK duplikat','Alamat Uji',nik);
  EXCEPTION WHEN unique_violation THEN rejected := true; END;
  IF NOT rejected THEN RAISE EXCEPTION 'NIK duplikat seharusnya ditolak'; END IF;
  rejected := false;
  BEGIN
    INSERT INTO public.muzakki(nama_kk,alamat,nik) VALUES ('NIK pendek','Alamat Uji','123');
  EXCEPTION WHEN check_violation THEN rejected := true; END;
  IF NOT rejected THEN RAISE EXCEPTION 'NIK tidak valid seharusnya ditolak'; END IF;
  INSERT INTO public.pembayaran_zakat(id,muzakki_id,tahun_zakat_id,jumlah_jiwa,jenis_zakat,jumlah_beras_kg,created_by)
    VALUES (zakat,h,yr,1,'beras',2.5,a);
  INSERT INTO public.mustahik(id,nama,alamat,kategori_id,jumlah_anggota) VALUES (must,'Mustahik Uji','Alamat Uji',kat,1);
  INSERT INTO public.distribusi_zakat(id,mustahik_id,tahun_zakat_id,jenis_distribusi,jumlah_beras_kg,created_by)
    VALUES (distribusi,must,yr,'beras',1,a);
  -- Historical household references must remain on their original ID after
  -- verifying a member; mapping must never transfer these transactions.
  INSERT INTO public.qurban_events(id,nama,tanggal,created_by) VALUES (event_id,'Qurban Uji',today,a);
  INSERT INTO public.qurban_animals(id,event_id,jenis,nomor,harga,created_by) VALUES (legacy_animal,event_id,'kambing','Legacy',1000,a);
  INSERT INTO public.qurban_shares(id,animal_id,muzakki_id,urutan,nominal,created_by) VALUES (legacy_share,legacy_animal,h,1,1000,a);
  INSERT INTO public.bukti_sedekah(id,receipt_number,category,category_key,donor_id,donor_name,donor_address,amount,tanggal,created_by)
    VALUES (legacy_donation,'TEST-' || legacy_donation::text,'Infak','infak',h,'Nama Sama','Alamat Uji',100,today,a);
  INSERT INTO public.pemasukan_uang(id,tahun_zakat_id,muzakki_id,kategori,akun,jumlah_uang_rp,tanggal,created_by)
    VALUES (legacy_income,yr,h,'maal_penghasilan_uang','kas',100,today,a);
  INSERT INTO public.pemasukan_beras(id,tahun_zakat_id,muzakki_id,kategori,jumlah_beras_kg,tanggal,created_by)
    VALUES (legacy_rice,yr,h,'infak_sedekah_beras',1,today,a);
  PERFORM set_config('request.jwt.claim.sub',a::text,true);
  PERFORM set_config('request.jwt.claims',jsonb_build_object('sub',a::text,'session_id',a::text)::text,true);
  PERFORM public.person_confirm_household(h);
  PERFORM public.person_add_household_member(h,'Anggota Uji',member);
  PERFORM public.person_map_mustahik(must,member);
  rejected := false;
  BEGIN PERFORM public.loan_confirm_individual(member,'Perubahan tidak tercatat'); EXCEPTION WHEN raise_exception THEN rejected := true; END;
  IF NOT rejected THEN RAISE EXCEPTION 'Nama terverifikasi harus diubah melalui alur yang diaudit'; END IF;
  PERFORM public.person_update_name(member,'Anggota Uji Diperbarui');
  INSERT INTO public.pembayaran_zakat(id,muzakki_id,tahun_zakat_id,jumlah_jiwa,jenis_zakat,jumlah_beras_kg,created_by)
    VALUES (member_zakat,member,yr,1,'beras',2.5,a);
  INSERT INTO public.qurban_animals(id,event_id,jenis,nomor,harga,created_by) VALUES (animal_id,event_id,'kambing','Uji',1000,a);
  INSERT INTO public.qurban_shares(id,animal_id,muzakki_id,urutan,nominal,created_by) VALUES (share_id,animal_id,member,1,1000,a);
  INSERT INTO public.bukti_sedekah(id,receipt_number,category,category_key,donor_id,donor_name,donor_address,amount,tanggal,created_by)
    VALUES (donation,'TEST-' || donation::text,'Infak','infak',member,'Anggota Uji','Alamat Uji',100,today,a);
  INSERT INTO public.pemasukan_uang(id,tahun_zakat_id,muzakki_id,kategori,akun,jumlah_uang_rp,tanggal,created_by)
    VALUES (income,yr,member,'maal_penghasilan_uang','kas',100,today,a);
  INSERT INTO public.pemasukan_beras(id,tahun_zakat_id,muzakki_id,kategori,jumlah_beras_kg,tanggal,created_by)
    VALUES (member_rice,yr,member,'infak_sedekah_beras',1,today,a);
  IF NOT EXISTS (SELECT 1 FROM public.pembayaran_zakat WHERE id=zakat AND muzakki_id=h)
     OR NOT EXISTS (SELECT 1 FROM public.distribusi_zakat WHERE id=distribusi AND mustahik_id=must)
     OR NOT EXISTS (SELECT 1 FROM public.mustahik WHERE id=must AND orang_id=member)
     OR NOT EXISTS (SELECT 1 FROM public.muzakki WHERE id=member AND rumah_tangga_id=h AND identitas_terverifikasi)
     OR NOT EXISTS (SELECT 1 FROM public.pembayaran_zakat WHERE id=member_zakat AND muzakki_id=member)
     OR NOT EXISTS (SELECT 1 FROM public.qurban_shares WHERE id=share_id AND muzakki_id=member)
     OR NOT EXISTS (SELECT 1 FROM public.qurban_shares WHERE id=legacy_share AND muzakki_id=h)
     OR NOT EXISTS (SELECT 1 FROM public.bukti_sedekah WHERE id=donation AND donor_id=member)
     OR NOT EXISTS (SELECT 1 FROM public.bukti_sedekah WHERE id=legacy_donation AND donor_id=h AND donor_name='Nama Sama')
     OR NOT EXISTS (SELECT 1 FROM public.pemasukan_uang WHERE id=income AND muzakki_id=member)
     OR NOT EXISTS (SELECT 1 FROM public.pemasukan_uang WHERE id=legacy_income AND muzakki_id=h)
     OR NOT EXISTS (SELECT 1 FROM public.pemasukan_beras WHERE id=legacy_rice AND muzakki_id=h)
     OR NOT EXISTS (SELECT 1 FROM public.pemasukan_beras WHERE id=member_rice AND muzakki_id=member) THEN
    RAISE EXCEPTION 'Identitas atau transaksi legacy berubah saat pemetaan';
  END IF;
  customer := public.loan_register_customer(member);
  IF public.loan_register_customer(member) <> customer OR
     (SELECT count(*) FROM public.loan_customers WHERE person_id=member) <> 1 THEN
    RAISE EXCEPTION 'Pendaftaran nasabah tidak boleh membuat identitas ganda';
  END IF;
  INSERT INTO public.loans(id,loan_number,customer_id,purpose,principal,status,disbursement_date,created_by)
    VALUES (loan,'TEST-' || loan::text,customer,'Uji',1000,'active',today,a);
  INSERT INTO public.loan_installments(loan_id,installment_number,due_date,amount) VALUES (loan,1,today,1000);
  PERFORM public.person_set_active(member,false);
  rejected := false;
  BEGIN
    PERFORM public.loan_create_draft(customer,(SELECT id FROM public.loan_categories LIMIT 1),'Pinjaman baru',1000,
      jsonb_build_array(jsonb_build_object('dueDate',today::text,'amount',1000)),gen_random_uuid());
  EXCEPTION WHEN raise_exception THEN
    IF SQLERRM NOT LIKE 'Nasabah harus individu aktif%' THEN RAISE; END IF;
    rejected := true;
  END;
  IF NOT rejected THEN RAISE EXCEPTION 'Nasabah nonaktif tidak boleh membuat pinjaman baru'; END IF;
  payment := public.loan_record_payment(loan,today,100,'tunai',NULL,gen_random_uuid());
  receipt := public.loan_receipt(payment,true);
  PERFORM public.person_update_name(member,'Nama Setelah Bukti');
  IF NOT EXISTS (SELECT 1 FROM public.bukti_sedekah WHERE id=donation AND donor_id=member AND donor_name='Anggota Uji' AND donor_address='Alamat Uji')
     OR NOT EXISTS (SELECT 1 FROM public.bukti_sedekah WHERE id=legacy_donation AND donor_id=h AND donor_name='Nama Sama' AND donor_address='Alamat Uji') THEN
    RAISE EXCEPTION 'Snapshot dokumen lama tidak boleh berubah saat identitas diperbarui';
  END IF;
  IF receipt->>'customer_name' <> 'Anggota Uji Diperbarui'
     OR public.loan_receipt(payment,false)->>'customer_name' <> 'Anggota Uji Diperbarui' THEN
    RAISE EXCEPTION 'Nama pada tanda terima harus tetap seperti saat diterbitkan';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM public.loans WHERE id=loan AND status='active') THEN RAISE EXCEPTION 'Kewajiban pinjaman tidak boleh hilang'; END IF;
  rejected := false;
  BEGIN DELETE FROM public.muzakki WHERE id=h; EXCEPTION WHEN foreign_key_violation THEN rejected := true; END;
  IF NOT rejected OR NOT EXISTS (SELECT 1 FROM public.pembayaran_zakat WHERE id=zakat) THEN RAISE EXCEPTION 'Penghapusan orang harus ditolak dan riwayat dipertahankan'; END IF;
  rejected := false;
  BEGIN DELETE FROM public.mustahik WHERE id=must; EXCEPTION WHEN foreign_key_violation THEN rejected := true; END;
  IF NOT rejected OR NOT EXISTS (SELECT 1 FROM public.distribusi_zakat WHERE id=distribusi) THEN RAISE EXCEPTION 'Penghapusan mustahik harus ditolak dan riwayat dipertahankan'; END IF;
  PERFORM set_config('test.people_actor', a::text, true);
  PERFORM set_config('test.people_customer', customer_user::text, true);
  PERFORM set_config('test.people_petugas', p::text, true);
  PERFORM set_config('test.people_viewer', viewer::text, true);
  PERFORM set_config('test.people_member', member::text, true);
  PERFORM set_config('test.people_share', share_id::text, true);
  PERFORM set_config('test.people_zakat', member_zakat::text, true);
  PERFORM set_config('test.people_legacy_share', legacy_share::text, true);
  PERFORM set_config('test.people_legacy_donation', legacy_donation::text, true);
  PERFORM set_config('test.people_member_donation', donation::text, true);
  PERFORM set_config('test.people_legacy_income', legacy_income::text, true);
  PERFORM set_config('test.people_member_income', income::text, true);
  PERFORM set_config('test.people_legacy_rice', legacy_rice::text, true);
  PERFORM set_config('test.people_member_rice', member_rice::text, true);
  PERFORM set_config('test.people_year', yr::text, true);
  PERFORM set_config('test.people_category', kat::text, true);
  PERFORM set_config('test.people_event', event_id::text, true);
  RAISE NOTICE 'PASS: identitas, NIK, pemetaan, retensi, dan pembayaran sesudah penonaktifan';
END;
$$;
SET LOCAL ROLE authenticated;
DO $$
DECLARE rejected BOOLEAN := false; v_member UUID := current_setting('test.people_member')::uuid;
  v_staff UUID := current_setting('test.people_petugas')::uuid; v_year UUID := current_setting('test.people_year')::uuid;
  v_category UUID := current_setting('test.people_category')::uuid;
  v_person UUID := gen_random_uuid(); v_zakat UUID := gen_random_uuid(); v_money UUID := gen_random_uuid();
  v_rice UUID := gen_random_uuid(); v_donation UUID := gen_random_uuid(); v_event UUID := gen_random_uuid();
  v_animal UUID := gen_random_uuid(); v_share UUID := gen_random_uuid(); v_mustahik UUID := gen_random_uuid(); v_distribution UUID := gen_random_uuid();
BEGIN
  PERFORM set_config('request.jwt.claim.sub', current_setting('test.people_actor'), true);
  PERFORM set_config('request.jwt.claims',jsonb_build_object('sub',current_setting('test.people_actor'),'session_id',current_setting('test.people_actor'))::text,true);
  BEGIN
    UPDATE public.muzakki SET nama_lengkap = 'Bypass' WHERE id = v_member;
  EXCEPTION WHEN insufficient_privilege THEN rejected := true; END;
  IF NOT rejected THEN RAISE EXCEPTION 'Perubahan identitas langsung seharusnya ditolak'; END IF;
  PERFORM public.person_set_active(v_member,true);
  PERFORM set_config('request.jwt.claim.sub', current_setting('test.people_petugas'), true);
  PERFORM set_config('request.jwt.claims',jsonb_build_object('sub',current_setting('test.people_petugas'),'session_id',current_setting('test.people_petugas'))::text,true);
  IF NOT EXISTS(SELECT 1 FROM public.qurban_shares WHERE id=current_setting('test.people_legacy_share')::uuid)
     OR NOT EXISTS(SELECT 1 FROM public.qurban_shares WHERE id=current_setting('test.people_share')::uuid)
     OR NOT EXISTS(SELECT 1 FROM public.bukti_sedekah WHERE id=current_setting('test.people_legacy_donation')::uuid)
     OR NOT EXISTS(SELECT 1 FROM public.bukti_sedekah WHERE id=current_setting('test.people_member_donation')::uuid)
     OR NOT EXISTS(SELECT 1 FROM public.pemasukan_uang WHERE id=current_setting('test.people_legacy_income')::uuid)
     OR NOT EXISTS(SELECT 1 FROM public.pemasukan_uang WHERE id=current_setting('test.people_member_income')::uuid)
     OR NOT EXISTS(SELECT 1 FROM public.pemasukan_beras WHERE id=current_setting('test.people_legacy_rice')::uuid)
     OR NOT EXISTS(SELECT 1 FROM public.pemasukan_beras WHERE id=current_setting('test.people_member_rice')::uuid)
  THEN RAISE EXCEPTION 'Petugas tidak dapat membaca salah satu transaksi program legacy atau anggota terpetakan'; END IF;
  -- Exercise the same authenticated RLS path used by the existing applications.
  INSERT INTO public.muzakki(id,nama_kk,alamat) VALUES(v_person,'Petugas menambah orang','Alamat Uji');
  INSERT INTO public.pembayaran_zakat(id,muzakki_id,tahun_zakat_id,jumlah_jiwa,jenis_zakat,jumlah_uang_rp,akun_uang,created_by)
    VALUES(v_zakat,v_member,v_year,1,'uang',10000,'kas',v_staff);
  INSERT INTO public.pemasukan_uang(id,tahun_zakat_id,muzakki_id,kategori,akun,jumlah_uang_rp,tanggal,created_by)
    VALUES(v_money,v_year,v_member,'maal_penghasilan_uang','kas',100,current_date,v_staff);
  INSERT INTO public.pemasukan_beras(id,tahun_zakat_id,muzakki_id,kategori,jumlah_beras_kg,tanggal,created_by)
    VALUES(v_rice,v_year,v_person,'infak_sedekah_beras',1,current_date,v_staff);
  INSERT INTO public.bukti_sedekah(id,receipt_number,category,category_key,donor_id,donor_name,donor_address,amount,tanggal,created_by)
    VALUES(v_donation,'RLS-'||v_donation::text,'Infak','infak',v_person,'Petugas menambah orang','Alamat Uji',100,current_date,v_staff);
  -- Event creation is admin-only in the existing program; a petugas may
  -- add an animal and participant to an already-created event.
  rejected := false;
  BEGIN INSERT INTO public.qurban_events(id,nama,tanggal,created_by) VALUES(v_event,'RLS qurban',current_date,v_staff);
  EXCEPTION WHEN insufficient_privilege THEN rejected := true; END;
  IF NOT rejected THEN RAISE EXCEPTION 'Petugas tidak boleh membuat event qurban'; END IF;
  v_event := current_setting('test.people_event')::uuid;
  INSERT INTO public.qurban_animals(id,event_id,jenis,nomor,harga,created_by) VALUES(v_animal,v_event,'kambing','RLS',1000,v_staff);
  INSERT INTO public.qurban_shares(id,animal_id,muzakki_id,urutan,nominal,created_by) VALUES(v_share,v_animal,v_member,1,1000,v_staff);
  INSERT INTO public.mustahik(id,nama,alamat,kategori_id,jumlah_anggota) VALUES(v_mustahik,'RLS mustahik','Alamat Uji',v_category,1);
  INSERT INTO public.distribusi_zakat(id,mustahik_id,tahun_zakat_id,jenis_distribusi,jumlah_uang_rp,created_by)
    VALUES(v_distribution,v_mustahik,v_year,'uang',100,v_staff);
  IF NOT EXISTS(SELECT 1 FROM public.muzakki WHERE id=v_person)
     OR NOT EXISTS(SELECT 1 FROM public.pembayaran_zakat WHERE id=v_zakat AND muzakki_id=v_member)
     OR NOT EXISTS(SELECT 1 FROM public.pemasukan_uang WHERE id=v_money AND muzakki_id=v_member)
     OR NOT EXISTS(SELECT 1 FROM public.pemasukan_beras WHERE id=v_rice AND muzakki_id=v_person)
     OR NOT EXISTS(SELECT 1 FROM public.bukti_sedekah WHERE id=v_donation AND donor_id=v_person)
     OR NOT EXISTS(SELECT 1 FROM public.qurban_shares WHERE id=v_share AND muzakki_id=v_member)
     OR NOT EXISTS(SELECT 1 FROM public.distribusi_zakat WHERE id=v_distribution AND mustahik_id=v_mustahik)
  THEN RAISE EXCEPTION 'Alur transaksi program existing tidak berhasil melalui role petugas'; END IF;
  PERFORM public.person_set_active(v_member,false);
  PERFORM public.person_set_active(v_member,true);
  PERFORM set_config('request.jwt.claim.sub', current_setting('test.people_viewer'), true);
  PERFORM set_config('request.jwt.claims',jsonb_build_object('sub',current_setting('test.people_viewer'),'session_id',current_setting('test.people_viewer'))::text,true);
  rejected := false;
  BEGIN PERFORM public.person_set_active(v_member,false); EXCEPTION WHEN insufficient_privilege THEN rejected := true; END;
  IF NOT rejected OR EXISTS (SELECT 1 FROM public.loan_customers WHERE person_id = v_member) THEN
    RAISE EXCEPTION 'Viewer tidak boleh mengubah status atau membaca nasabah pinjaman tanpa izin';
  END IF;
  PERFORM set_config('request.jwt.claim.sub', current_setting('test.people_customer'), true);
  PERFORM set_config('request.jwt.claims',jsonb_build_object('sub',current_setting('test.people_customer'),'session_id',current_setting('test.people_customer'))::text,true);
  IF EXISTS (SELECT 1 FROM public.pembayaran_zakat WHERE id = current_setting('test.people_zakat')::uuid)
     OR EXISTS (SELECT 1 FROM public.qurban_shares WHERE id = current_setting('test.people_share')::uuid) THEN
    RAISE EXCEPTION 'Nasabah tanpa profil pengurus tidak boleh membaca riwayat program lama';
  END IF;
  rejected := false;
  BEGIN PERFORM public.person_set_active(v_member,false); EXCEPTION WHEN insufficient_privilege THEN rejected := true; END;
  IF NOT rejected THEN RAISE EXCEPTION 'Nasabah tidak boleh mengubah status orang'; END IF;
  RAISE NOTICE 'PASS: peran authenticated, verifikasi server, dan akses nasabah';
END;
$$;
RESET ROLE;
ROLLBACK;
