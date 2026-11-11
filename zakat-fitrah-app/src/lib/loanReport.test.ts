import { describe, expect, it } from 'vitest';
import { csvCell, groupReport, regionLabel, reportRows, type ReportFilters, type ReportLoan } from './loanReport';

const filters: ReportFilters = {from:'2026-01-01',to:'2026-03-31',asOf:'2026-02-01',category:'',customer:'',region:'',status:''};
const example = (overrides: Partial<ReportLoan> = {}): ReportLoan => ({
  id:'loan-1',number:'P-001',customer_id:'customer-1',name:'Aminah',category_id:'cat-1',category:'Usaha',purpose:'Warung',principal:1200000,status:'paid',disbursement_date:'2026-01-01',region:{rt:'01',rw:'02',alamat:'Alamat saat pencairan'},migration_cutoff:null,opening_balance:null,historical_incomplete:false,
  disbursement:{date:'2026-01-01',amount:1200000},installments:[{dueDate:'2026-02-01',amount:400000,opening_remaining:null},{dueDate:'2026-03-01',amount:400000,opening_remaining:null},{dueDate:'2026-04-01',amount:400000,opening_remaining:null}],
  payments:[{id:'one',date:'2026-01-20',amount:250000,status:'confirmed'},{id:'two',date:'2026-02-02',amount:550000,status:'confirmed'},{id:'three',date:'2026-02-03',amount:400000,status:'confirmed'},{id:'four',date:'2026-02-04',amount:100000,status:'pending'},{id:'five',date:'2026-02-05',amount:100000,status:'cancelled'}],followups:[],has_contract:true,...overrides,
});

describe('dashboard laporan pinjaman', () => {
  it('memisahkan arus periode dari posisi historis dan tidak memakai status lunas saat ini untuk tanggal sebelumnya', () => {
    const [row]=reportRows([example()],filters);
    expect(row.disbursed).toBe(1200000); expect(row.paid).toBe(1200000);
    expect(row.positionStatus).toBe('active'); expect(row.position?.remaining).toBe(950000); expect(row.position?.dueToday).toBe(150000);
    const [later]=reportRows([example()],{...filters,asOf:'2026-02-04'});
    expect(later.positionStatus).toBe('paid'); expect(later.position?.remaining).toBe(0);
    expect(row.loan.region?.alamat).toBe('Alamat saat pencairan');
  });
  it('menghitung agregat unik dan filter kategori, orang, wilayah serta status', () => {
    const other=example({id:'loan-2',number:'P-002',principal:1200000,region:null});
    const rows=reportRows([example(),other],filters);
    expect(groupReport(rows,r=>r.loan.category)[0]).toMatchObject({loans:2,customers:1,disbursed:2400000,remaining:1900000});
    expect(regionLabel(null)).toBe('Wilayah belum diisi');
    expect(reportRows([example(),other],{...filters,region:'Wilayah belum diisi'})).toHaveLength(1);
    expect(reportRows([example()],{...filters,category:'beda'})).toHaveLength(0);
    expect(reportRows([example()],{...filters,customer:'P-001',status:'active'})).toHaveLength(1);
    expect(reportRows([example()],{...filters,customer:'lain'})).toHaveLength(0);
  });
  it('menandai saldo migrasi yang belum lengkap dan tidak mengarang arus tanpa tanggal', () => {
    const legacy=example({migration_cutoff:'2026-01-31',opening_balance:900000,historical_incomplete:true,disbursement:null,installments:[{dueDate:'2026-02-01',amount:1200000,opening_remaining:null}]});
    const [row]=reportRows([legacy],filters);
    expect(row.incomplete).toBe(true); expect(row.position).toBeNull(); expect(row.disbursed).toBe(0);
    expect(groupReport([row],r=>r.loan.category)[0]).toMatchObject({remaining:0,incomplete:1});
  });
  it('menetralkan formula CSV termasuk spasi, tab, kontrol dan tanda kutip', () => {
    expect(csvCell(' =HYPERLINK("bad")')).toBe('"\' =HYPERLINK(""bad"")"');
    expect(csvCell('\t+1')).toBe('"\'\t+1"');
    expect(csvCell(String.fromCharCode(1)+'@x')).toBe('"\''+String.fromCharCode(1)+'@x"');
    expect(csvCell('aman')).toBe('"aman"');
  });
});
