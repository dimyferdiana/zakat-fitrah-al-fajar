import { describe, expect, it } from 'vitest';
import { classifyCollectibility, type CollectibilityConfig } from './loanCollectibility';

const config: CollectibilityConfig = { enabled:true,version:1,ranges:[
  {label:'Lancar',min:0,max:0},{label:'Perhatian',min:1,max:7},{label:'Kurang lancar',min:8,max:30},
  {label:'Bermasalah',min:31,max:90},{label:'Macet',min:91,max:null},
] };
describe('kolektabilitas sebagai acuan DPD', () => {
  it('mengikuti batas tiap rentang', () => {
    expect([0,1,7,8,30,31,90,91].map(dpd=>classifyCollectibility(dpd,config))).toEqual([
      'Lancar','Perhatian','Perhatian','Kurang lancar','Kurang lancar','Bermasalah','Bermasalah','Macet',
    ]);
  });
  it('menyembunyikan label saat nonaktif atau posisi tidak tersedia', () => {
    expect(classifyCollectibility(0,{...config,enabled:false})).toBeNull();
    expect(classifyCollectibility(null,config)).toBeNull();
    expect(classifyCollectibility(-1,config)).toBeNull();
  });
});
