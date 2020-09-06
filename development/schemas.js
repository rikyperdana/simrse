/*global ors _ state selects randomId beds ands withThis lookReferences*/

var schemas = {
  identity: {
    queue_num: {type: String, optional: true, exclude: true},
    mr_num: {
      type: Number, label: 'MR Num.',
      autoform: {help: 'randomized and may be changed'},
      autoValue: (name, doc, opts) =>
        // jika update, gunakan No. MR yg sudah ada
        opts.id === 'updatePatient' ?
        _.get(state, 'onePatient.identitas.mr_num')
        // No. MR otomatis 6 angka, silahkan naikkan jika perlu
        : Math.floor(Math.random() * 1e6)
    },
    alias: {
      type: Number, optional: true,
      autoform: {type: 'select', options: selects('alias')}
    },
    nama_lengkap: {type: String, autoform: {placeholder: '4 letters minimum'}},
    ktp: {type: Number, label: 'Citizen ID', optional: true},
    bpjs: {type: Number, label: 'Insurance Num.', optional: true},
    tanggal_lahir: {type: Date},
    tempat_lahir: {type: String},
    kelamin: {
      type: Number, label: 'Gender',
      autoform: {type: 'select', options: selects('kelamin')}
    },
    agama: {
      type: Number, optional: true, label: 'Religion',
      autoform: {type: 'select', options: selects('agama')}
    },
    nikah: {
      type: Number, label: 'Marital Status', optional: true,
      autoform: {type: 'select', options: selects('nikah')}
    },
    pendidikan: {
      type: Number, label: 'Last Education', optional: true,
      autoform: {type: 'select', options: selects('pendidikan')}
    },
    darah: {
      type: Number, label: 'Blood Type', optional: true,
      autoform: {type: 'select', options: selects('darah')}
    },
    pekerjaan: {
      type: Number, label: 'Current Occupation', optional: true,
      autoform: {type: 'select', options: selects('pekerjaan')}
    },
    tempat_tinggal: {type: String, optional: true, label: 'Home Address'},
    kontak: {type: Number, optional: true, label: 'Phone Number'},
    keluarga: {type: Object},
    'keluarga.ayah': {type: String, optional: true, label: 'Father Name'},
    'keluarga.ibu': {type: String, optional: true, label: 'Mother Name'},
    'keluarga.pasangan': {type: String, optional: true, label: 'Spouse Name'},
    petugas: {
      type: String, autoform: {type: 'hidden'},
      autoValue: () =>_.get(state.login, '_id')
    },
    tanggal_input: {
      type: Number, autoform: {type: 'hidden'},
      autoValue: () => _.now()
    }
  },

  rawatJalan: {
    idrawat: {
      type: String, autoform: {type: 'hidden'},
      autoValue: () => randomId()
    },
    tanggal: {
      type: Number, autoform: {type: 'hidden'},
      autoValue: () => _.now()
    },
    no_antrian: {type: String, optional: true, exclude: true},
    cara_bayar: {type: Number, label: 'Payment Method', autoform: {
      type: 'select', options: selects('cara_bayar')
    }},
    no_sep: {
      type: String, optional: true,
      autoform: {placeholder: 'fill with reference number if payment method is by insurance'}
    },
    klinik: {type: Number, autoform: {
      type: 'select', options: selects('klinik')
    }},
    rujukan: {type: Number, autoform: {
      type: 'select', options: selects('rujukan')
    }},
    sumber_rujukan: {type: String, optional: true},
    penaggungjawab: {type: String, optional: true}
  },

  soapPerawat: {
    anamnesa: {type: String, autoform: {type: 'textarea'}},
    fisik: {type: Object},
    'fisik.tekanan_darah': {type: Object,},
    'fisik.tekanan_darah.systolic': {type: Number, optional: true},
    'fisik.tekanan_darah.diastolic': {type: Number, optional: true},
    'fisik.nadi': {type: Number, optional: true},
    'fisik.suhu': {type: Number, optional: true},
    'fisik.pernapasan': {type: Number, optional: true},
    'fisik.tinggi': {type: Number, optional: true},
    'fisik.berat': {type: Number, optional: true},
    'fisik.lila': {type: Number, optional: true},
    tracer: {type: String, optional: true, label: 'File Tracer'},
    perawat: {
      type: String, autoform: {type: 'hidden'},
      autoValue: () => _.get(state.login, '_id')
    }
  },

  soapDokter: {
    anamnesa: {type: String, autoform: {type: 'textarea'}},
    diagnosa: {type: Array},
    'diagnosa.$': {type: Object},
    'diagnosa.$.text': {type: String},
    tindakan: {type: Array, optional: true},
    'tindakan.$': {type: Object},
    'tindakan.$.idtindakan': {type: String, autoform: {
      type: 'select', options: (name, doc) =>
        _.sortBy(state.daftarTindakan.map(i =>
          ({value: i._id, label: i.nama})
        ), ['label'])
    }},
    'tindakan.$.jadwal': {
      type: Date, optional: true, autoform: {
        type: 'datetime-local',
        help: 'Only use if scheduled in the future'
      }
    },
    bhp: {type: Array, optional: true, label: 'Disposable goods'},
    'bhp.$': {type: Object},
    'bhp.$.idbarang': {
      type: String, label: 'Good Name',
      autoform: {type: 'select', options: () =>
        state.bhpList.map(i =>
          ({value: i._id, label: i.nama})
        )
      }
    },
    'bhp.$.jumlah': {type: Number},
    obat: {type: Array, optional: true},
    'obat.$': {type: Object},
    'obat.$.idbarang': {
      type: String, label: 'Medicine Name',
      autoform: {type: 'select', options: () =>
        state.drugList.map(i =>
          ({value: i._id, label: i.nama})
        )
      }
    },
    'obat.$.jumlah': {type: Number},
    'obat.$.puyer': {
      type: Number, optional: true,
      autoform: {help: 'kode unik puyer'}
    },
    'obat.$.aturan': {type: Object, optional: true},
    'obat.$.aturan.kali': {type: Number},
    'obat.$.aturan.dosis': {type: String},
    radio: {type: Array, optional: true, label: 'Radiology'},
    'radio.$': {type: Object},
    'radio.$.grup': {type: String, optional: true, autoform: {
      help: 'Filter by category',
      type: 'select', options: () => _.uniq(
        state.references
        .filter(i => i[0] === 'radiologi')
        .map(i => i[1])
      ).map(i => ({value: i, label: _.startCase(i)}))
    }},
    'radio.$.idradio': {type: String, autoRedraw: true, autoform: {
      type: 'select', options: (name, doc) =>
        _.sortBy(
          state.references.filter(i => ands([
            i[0] === 'radiologi',
            withThis(
              _.initial(name.split('.')).join('.') + '.grup',
              siblingGrup => _.get(doc, siblingGrup) ?
                doc[siblingGrup] === i[1] : true
            )
          ]))
          .map(i => ({value: i._id, label: i.nama})),
          'label'
        )
    }},
    'radio.$.catatan': {type: String, optional: true},
    labor: {type: Array, optional: true, label: 'Laboratory'},
    'labor.$': {type: Object},
    'labor.$.grup': {type: String, optional: true, autoform: {
      help: 'Filter by category',
      type: 'select', options: () => _.uniq(
        state.references
        .filter(i => i[0] === 'laboratorium')
        .map(i => i[1])
      ).map(i => ({value: i, label: _.startCase(i)}))
    }},
    'labor.$.idlabor': {type: String, autoRedraw: true, autoform: {
      type: 'select', options: (name, doc) =>
        _.sortBy(
          state.references.filter(i => ands([
            i[0] === 'laboratorium',
            withThis(
              _.initial(name.split('.')).join('.') + '.grup',
              siblingGrup => _.get(doc, siblingGrup) ?
                doc[siblingGrup] === i[1] : true
            )
          ]))
          .map(i => ({value: i._id, label: i.nama})),
          'label'
        )
    }},
    planning: {
      type: String, optional: true,
      autoform: {type: 'textarea'}
    },
    keluar: {type: Number, autoform: {
      type: 'select', options: selects('keluar')
    }},
    rujuk: {
      type: Number, optional: true, label: 'Consult to a clinic',
      autoform: { // hanya munculkan bila pilihan keluar 'rujuk'
        type: 'select', options: selects('klinik'),
        help: 'Only fill if choice of exit is to consult to other clinic'
      }
    },
    tracer: {type: String, optional: true, label: 'File Tracer'},
    spm: {
      type: Number, autoform: {type: 'hidden'},
      autoValue: () => _.now() - state.spm
    },
    dokter: {
      type: String, autoform: {type: 'hidden'},
      autoValue: () => _.get(state.login, '_id')
    },
    tanggal: {
      type: String, autoform: {type: 'hidden'},
      autoValue: () => _.now()
    }
  },

  account: {
    nama: {type: String, label: 'Full Name'},
    username: {type: String},
    password: {type: String, autoform: {type: 'password'}},
    peranan: {type: Number, autoform: {
      type: 'select', options: selects('peranan')
    }},
    bidang: {type: Number, optional: true, autoform: {
      type: 'select', options: selects('bidang')
    }},
    poliklinik: {type: Number, optional: true, autoform: {
      type: 'select', options: selects('klinik'),
      help: 'Only fill if the user belong to a clinic'
    }},
    keaktifan: {type: Number, autoform: {
      type: 'select', options: selects('keaktifan')
    }},
  },

  barang: {
    nama: {type: String},
    jenis: {type: Number, autoform: {
      type: 'select', options: selects('jenis_barang')
    }},
    kandungan: {type: String},
    satuan: {type: Number, autoform: {
      type: 'select', options: selects('satuan')
    }},
    stok_minimum: {type: Object},
    'stok_minimum.gudang': {type: Number},
    'stok_minimum.apotik': {type: Number},
    kriteria: {type: Object},
    'kriteria.antibiotik': {type: Number, autoform: {
      type: 'select', options: selects('boolean')
    }},
    'kriteria.narkotika': {type: Number, autoform: {
      type: 'select', options: selects('boolean')
    }},
    'kriteria.psikotropika': {type: Number, autoform: {
      type: 'select', options: selects('boolean')
    }},
    'kriteria.fornas': {type: Number, autoform: {
      type: 'select', options: selects('boolean')
    }},
    kode_rak: {type: String, optional: true},
    petugas: {
      type: String, autoform: {type: 'hidden'},
      autoValue: () => _.get(state.login, '_id')
    }
  },

  batch: {
    idbatch: {
      type: String, autoform: {type: 'hidden'},
      autoValue: () => randomId()
    },
    no_batch: {type: String},
    merek: {type: String},
    masuk: {type: Date},
    kadaluarsa: {type: Date},
    stok: {type: Object},
    'stok.gudang': {type: Number, autoform: {help: 'Based on smallest unit'}},
    harga: {type: Object},
    'harga.beli': {type: Number},
    'harga.jual': {type: Number},
    sumber: {type: Object},
    'sumber.supplier': {type: String},
    'sumber.anggaran': {type: String, optional: true},
    'sumber.no_spk': {type: String, optional: true},
    'sumber.tanggal_spk': {type: Date, optional: true},
    petugas: {
      type: String, autoform: {type: 'hidden'},
      autoValue: () => _.get(state.login, '_id')
    }
  },

  amprah: {
    idamprah: {
      type: String, autoform: {type: 'hidden'},
      autoValue: () => randomId()
    },
    ruangan: {
      type: Number, autoform: {type: 'hidden'},
      autoValue: () => ors([
        _.get(state.login, 'bidang'),
        _.get(state.login, 'poliklinik')
      ])
    },
    peminta: {
      type: String, autoform: {type: 'hidden'},
      autoValue: () => _.get(state.login, '_id')
    },
    diminta: {
      type: Number, label: 'Jumlah diminta',
      minMax: () => [1, _.get(state, 'oneBatch.stok.gudang')]
    },
    tanggal_minta: {
      type: Number, autoform: {type: 'hidden'},
      autoValue: () => _.now()
    }
  },

  responAmprah: {
    diserah: {
      type: Number, label: 'Jumlah diserahkan',
      minMax: () => [1, _.get(state, 'oneAmprah.digudang')]
    },
    penyerah: {
      type: String, autoform: {type: 'hidden'},
      autoValue: () => _.get(state.login, '_id')
    },
    tanggal_serah: {
      type: Number, autoform: {type: 'hidden'},
      autoValue: () => _.now()
    }
  },

  login: {
    username: {type: String},
    password: {type: String, autoform: {type: 'password'}}
  },

  beds: {
    kelas: {type: String, autoform: {
      type: 'select', options: () => _.keys(beds).map(
        j => ({value: j, label: _.upperCase(j)})
      )
    }},
    kamar: {type: String, autoform: {
      type: 'select', options: () =>
        _.flatten(_.values(beds).map(j => _.keys(j.kamar)))
        .map(j => ({value: j, label: _.startCase(j)}))
    }},
    nomor: {type: Number},
  },
  overcharge: {
    charges: {type: Array, optional: true},
    'charges.$': {type: Object},
    'charges.$.item': {type: String, label: 'Fee name'},
    'charges.$.harga': {type: Number}
  },
  confirmRadiology: {
    konfirmasi: {
      type: Number, autoform: {
        type: 'select', options: selects('konfirmasi')
      }
    },
    tanggal: {
      type: Number, autoform: {type: 'hidden'},
      autoValue: () => _.now()
    }
  },
  responRadiology: {
    kode_berkas: {type: String},
    diagnosa: {type: String, autoform: {type: 'textarea', rows: 10}},
    pengarsipan: {type: Number, autoform: {
      type: 'select', options: selects('pengarsipan')
    }},
    petugas: {
      type: String, autoform: {type: 'hidden'},
      autoValue: () => _.get(state.login, '_id')
    }
  },
  responLaboratory: {
    labor: {type: Array, fixed: true},
    'labor.$': {type: Object},
    'labor.$.idlabor': {
      type: String, autoform: {type: 'hidden'},
      autoValue: (name, doc) => doc[name]
    },
    'labor.$.item_labor': {
      type: String, autoform: {type: 'readonly'}, exclude: true,
      autoValue: (name, doc) => lookReferences(doc[
        _.initial(name.split('.')).join('.') + '.idlabor'
      ]).nama
    },
    'labor.$.tanggal': { // tanggal pengambilan sample
      type: Number, autoform: {type: 'hidden'},
      autoValue: () => _.now()
    }
  },
  gizi: {
    konsumsi: {
      type: String, label: 'Nutrition requirement',
      optional: true, autoform: {type: 'textarea'}
    }
  }
}
