/*global _ state*/

var selects = name => _.reduce(
  {
    alias: ['mr.', 'mrs.', 'ms.', 'child', 'baby'],
    kelamin: ['male', 'female'],
    agama: ['islam', 'chatolic', 'protestant', 'budha', 'hindu', 'konghuchu'],
    nikah: ['married', 'single', 'widow'],
    pendidikan: ['primary_school', 'junior_high_school', 'high_school', 'diploma', 'bachelor', 'postgraduate', 'doctorate', 'no school'],
    darah: ['a', 'b', 'ab', 'o'],
    pekerjaan: ['government_official', 'private', 'enterpreneur', 'army', 'police', 'retiree', 'others'],
    cara_bayar: ['self_pay', 'insurance'],
    // kodepoli:     ['int',            'ana',  'obg',   'bed',   'gig'], // referensi INACBGs
    klinik:       ['internal_disease', 'pediatrician', 'obgyn', 'surgery', 'dentist', 'general'],
    tarif_klinik: [ 95,                 95,             95,      95,        95,        45],
    rujukan: ['came_alone', 'other_hospital', 'public_health_center', 'other_facility'],
    keluar: ['discharged', 'consult_to_other_clinic', 'to be inpatient'],
    jenis_barang: ['Medicine', 'consumables', 'logistic'],
    satuan: ['bottle', 'vial', 'ampoule', 'pcs', 'sachets', 'tube', 'supp', 'tablet', 'minidose', 'pot', 'turbuhaler', 'caplet', 'capsule', 'bag', 'pen', 'rectal', 'flash', 'cream', 'nebu', 'gallon', 'sheet', 'roll', 'liter', 'cup', 'pair', 'wrap', 'box', 'syringe'],
    boolean: ['yes', 'no'],
    konfirmasi: ['process', 'decline'],
    peranan: ['staff', 'nurse', 'doctor', 'admin'],
    bidang: ['registration', 'cashier', 'storage', 'pharmacy', 'management', 'outpatient', 'inpatient', 'laboratory', 'radiology', 'nutrition_dept'],
    keaktifan: ['active', 'inactive'],
    pengarsipan: ['hospital', 'self_keep']
  }, (res, inc, key) =>
    _.merge(res, {[key]: () => _.map(inc, (val, key) =>
      ({label: _.startCase(val), value: key+1})
    )})
  , {}
)[name],

look = (category, value) => _.get(
  selects(category)().filter((i, j) =>
    j+1 === value
  )[0], 'label'
) || '-',

lookGoods = _id =>
  _id && state.goodsList
  .filter(i => i._id === _id)[0],

lookReferences = _id =>
  _id && state.references
  .filter(i => i._id === _id)[0],

lookUser = id =>
  !id ? '-' : _.get(state.userList.find(
    i => i._id === id
  ), 'nama') || '-'
