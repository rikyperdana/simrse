/*global pdfMake hari _ ors lookUser hari rupiah look lookReferences moment state lookGoods withThis beds tarifIGD tarifKartu localStorage defaultStyle*/

var kop = {text: 'RUMAH SAKIT MEDICARE\nJL. Dt. Laksamana No. 1, Pangkalan Kuras, Pelalawan, Provinsi Riau.\n\n', alignment: 'center', bold: true},
makePdf = {
  card: identity =>
    pdfMake.createPdf(defaultStyle({
      content: [
        'Nama: '+identity.nama_lengkap,
        'No. MR: '+identity.mr_num
      ],
      pageSize: 'B8',
      pageMargins: [110, 50, 0, 0],
      pageOrientation: 'landscape'
    })).download('kartu_peserta_'+identity.mr_num),

  consent: identity =>
    pdfMake.createPdf(defaultStyle({content: [
      kop,
      {text: 'Data Umum Pasien\n', alignment: 'center'},
      {columns: [
        ['No. MR', 'Nama Lengkap', 'Tempat & Tanggal Lahir', 'Nama Ibu', 'Alamat', 'Kontak'],
        [
          identity.mr_num,
          identity.nama_lengkap,
          (identity.tempat_lahir || '')+', '+day(identity.tanggal_lahir),
          _.get(identity.keluarga, 'ibu') || '',
          identity.tempat_tinggal || '',
          identity.kontak || ''
        ].map(i => ': '+i)
      ]},
      {text: '\nPersetujuan Umum General Consent\n', alignment: 'center'},
      {table: {body: [
        ['S', 'TS', {text: 'Keterangan', alignment: 'center'}],
        ['', '', 'Saya akan mentaati peraturan yang berlaku di RS Medicare.'],
        ['', '', 'Saya memberi kuasa kepada dokter dan semua tenaga kesehatan untuk melakukan pemeriksaan / pengobatan / tindakan yang diperlukan dalam upaya kesembuhan saya / pasien tersebut diatas.'],
        ['', '', 'Saya memberi kuasa kepada dokter dan semua tenaga kesehatan yang ikut merawat saya untuk memberikan keterangan medis saya kepada yang bertanggungjawab atas biaya perawatan saya.'],
        ['', '', 'Saya memberi kuasa kepada RS Medicare untuk menginformasikan identity sosial saya kepada keluarga / rekan / masyarakat.'],
        ['', '', 'Saya mengatakan bahwa informasi hasil pemeriksaan / rekam medis saya dapat digunakan untuk pendidikan / penelitian demi kemajuan ilmu kesehatan.']
      ]}},
      '\nPetunjuk :\nS: Setuju\nTS: Tidak Setuju',
      {alignment: 'justify', columns: [
        {text: '\n\n\n\n__________________\n'+state.login.nama, alignment: 'center'},
        {text: 'Pangkalan Kuras, '+day(_.now())+'\n\n\n\n__________________\nPasien', alignment: 'center'}
      ]}
    ]})).download('general_consent_'+identity.mr_num),

  bayar_pendaftaran: (pasien, rawat, rawatLength) =>
    pdfMake.createPdf(defaultStyle({content: [kop, {columns: [
      ['Tanggal', 'No. MR', 'Nama Pasien', 'Tarif', 'Petugas'],
      [
        day(_.now()),
        pasien.identity.mr_num,
        pasien.identity.nama_lengkap,
        'Total: '+currency(_.sum([
          rawatLength > 1 ? 0 : tarifKartu,
          1000 * +look('tarif_klinik', rawat.klinik)
        ])),
        state.login.nama
      ].map(i => ': '+i)
    ]}]})).download('bayar_pendaftaran_'+pasien.identity.mr_num),

  bayar_konsultasi: (pasien, rawat, bills) =>
    pdfMake.createPdf(defaultStyle({content: [
      kop,
      {columns: [
        ['No. MR', 'Nama Pasien', 'Jenis Kelamin', 'Tanggal Lahir', 'Umur', 'Layanan'],
        [
          pasien.identity.mr_num,
          _.startCase(pasien.identity.nama_lengkap),
          look('kelamin', pasien.identity.kelamin) || '-',
          day(pasien.identity.tanggal_lahir),
          moment().diff(pasien.identity.tanggal_lahir, 'years')+' tahun',
          ors([
            rawat.observasi && 'Rawat Inap',
            rawat.klinik && look('klinik', rawat.klinik).label,
            'Emergency'
          ])
        ]
      ]},
      {text: '\n\nRincian Pembayaran', alignment: 'center'},
      {table: {widths: ['*', 'auto'], body: _.concat(
        [['Uraian', 'Harga']],
        [...bills].map(i => [i.item, currency(i.harga)])
      )}},
      '\nTotal Biaya '+currency(_.sum(bills.map(i => i.harga))),
      {text: '\nP. Kuras, '+day(_.now())+'\n\n\n\n\nPetugas', alignment: 'right'}
    ]})).download('bayar_konsultasi_'+pasien.identity.mr_num),

  soap: (identity, rawat) =>
    pdfMake.createPdf(defaultStyle({content: [
      kop,
      {table: {widths: ['auto', '*', 'auto'], body: [
        [
          'Nama: '+identity.nama_lengkap,
          'Tanggal lahir: '+day(identity.tanggal_lahir),
          'No. MR: '+identity.mr_num
        ],
        [
          'Kelamin: '+look('kelamin', identity.kelamin),
          'Tanggal kunjungan: '+day(ors([
            rawat.tanggal, rawat.tanggal_masuk,
            _.get(rawat, 'soapDokter.tanggal')
          ])),
          'Gol. Darah: '+look('darah', identity.darah)],
        [
          'Klinik: '+look('klinik', rawat.klinik),
          'Tanggal cetak: '+day(_.now()),
          'Cara bayar: '+look('cara_bayar', rawat.cara_bayar)
        ],
        [
          'Perawat: '+(lookUser(_.get(rawat, 'soapPerawat.perawat')) || '-'),
          'Dokter: '+(lookUser(_.get(rawat, 'soapDokter.dokter')) || '-'),
          ''
        ]
      ]}},
      rawat.soapPerawat ? [
        {text: '\nSOAP Perawat', alignment: 'center', bold: true},
        {table: {widths: ['*', '*', '*'], body: [
          [
            'Tinggi/Berat: '+(_.get(rawat, 'soapPerawat.fisik.tinggi') || '-')+'/'+(_.get(rawat, 'soapPerawat.fisik.berat') || '-'),
            'Suhu: '+(_.get(rawat, 'soapPerawat.fisik.suhu') || '-')+' C',
            'LILA: '+(_.get(rawat, 'soapPerawat.fisik.lila') || '-')
          ], [
            'Pernapasan: '+(_.get(rawat, 'soapPerawat.fisik.pernapasan') || '-'),
            'Nadi: '+(_.get(rawat, 'soapPerawat.fisik.nadi') || '-'),
            'Tekanan darah: '+_.join(_.values(_.get(rawat, 'soapPerawat.fisik.tekanan_darah') || '-'), '/')
          ]
        ]}}, '\n',
        {table: {widths: ['auto', '*'], body: [
          ['Anamnesa perawat', (_.get(rawat, 'soapPerawat.anamnesa') || '-')],
          [
            'Rujukan: '+look('rujukan', _.get(rawat, 'soapPerawat.rujukan')),
            'Sumber: '+(_.get(rawat, 'soapPerawat.sumber_rujukan') || '-')
          ],
        ]}},
      ] : '',
      rawat.soapDokter ? [
        {text: '\nSOAP Dokter', alignment: 'center', bold: true},
        {table: {widths: ['auto', '*'], body: [
          ['Anamnesa dokter', (_.get(rawat, 'soapDokter.anamnesa') || '-')],
          ['Planning', (_.get(rawat, 'soapDokter.planning') || '-')]
        ]}},
        _.get(rawat, 'soapDokter.diagnosa') && [
          {text: '\nDiagnosa', alignment: 'center'},
          {table: {widths: ['*', 'auto'], body: [
            ['Teks', 'ICD10'],
            ..._.get(rawat, 'soapDokter.diagnosa')
            .map(i => [i.text, i.code || '-'])
          ]}}
        ],
        _.get(rawat, 'soapDokter.tindakan') && [
          {text: '\nTindakan', alignment: 'center'},
          {table: {widths: ['*', 'auto'], body: [
            ['Nama Tindakan', 'ICD9-CM'],
            ..._.get(rawat, 'soapDokter.tindakan').map(i =>
              [lookReferences(i.idtindakan).nama, i.code || '-']
            )
          ]}}
        ],
        _.get(rawat, 'soapDokter.obat') && [
          {text: '\nObat', alignment: 'center'},
          {table: {widths: ['*', 'auto', 'auto'], body: [
            ['Nama obat', 'Jumlah', 'Puyer'],
            ..._.get(rawat, 'soapDokter.obat').map(i => [
              _.get(lookGoods(i.idbarang), 'nama'),
              i.jumlah, i.puyer || '-'
            ])
          ]}}
        ],
        _.get(rawat, 'soapDokter.radio') && [
          {text: '\nRadiologi', alignment: 'center'},
          {table: {widths: ['*', 'auto', 'auto'], body: [
            ['Radiologi', 'No. Berkas', 'Diagnosa'],
            ..._.get(rawat, 'soapDokter.radio').map(i => [
              _.get(lookReferences(i.idradio), 'nama'),
              i.kode_berkas, i.diagnosa
            ])
          ]}}
        ],
        _.get(rawat, 'soapDokter.labor') && [
          {text: '\nLaboratorium', alignment: 'center'},
          {table: {widths: ['*', 'auto'], body: [
            ['Laboratorium', 'Diagnosa'],
            ..._.get(rawat, 'soapDokter.labor').map(i => [
              _.get(lookReferences(i.idlabor), 'nama'),
              i.hasil || '-'
            ])
          ]}}
        ]
      ].filter(Boolean) : ''
    ]})).download('soap_'+identity.mr_num),

  resep: (drugs, mr_num) =>
    pdfMake.createPdf(defaultStyle({content: [
      kop,
      {text: 'Salinan Resep\n\n', alignment: 'center', bold: true},
      {table: {
        widths: ['*', 'auto', 'auto', 'auto', 'auto', 'auto'],
        body: [
          ['Nama Obat', 'Jumlah', 'Kali', 'Dosis', 'Puyer', 'Harga'],
          ...[...drugs].map(i => [
            i.nama_barang, i.serahkan+' unit',
            _.get(i, 'aturan.kali') || '-',
            _.get(i, 'aturan.dosis') || '-',
            i.puyer || '-', currency(i.harga || i.jual)
          ]),
          ['Total', '', '', '', '', currency(_.sum(drugs.map(i => i.harga || i.jual)))]
        ]
      }},
      {alignment: 'justify', columns: [
        {text: '', alignment: 'center'},
        {text: '\nPangkalan Kuras, '+day(_.now())+'\n\n\n\n__________________\n'+state.login.nama, alignment: 'center'}
      ]},
      {text: '\n\n-------------------------------------potong disini------------------------------------------', alignment: 'center'},
      {text: '\nInstruksi penyerahan obat'},
      {table: {body: [
        ['Nama Barang', 'No. Batch', 'Jumlah'],
        ...drugs.map(i => [i.nama_barang, i.no_batch, i.serahkan])
      ]}}
    ]})).download('salinan_resep_'+mr_num),

  report: (title, rows, info) =>
    pdfMake.createPdf(defaultStyle({
      pageOrientation: 'landscape',
      defaultStyle: {fontSize: 10},
      content: [
        kop,
        {text: title, alignment: 'center', bold: true},
        info && {text: info+'\n\n', alignment: 'center', bold: true},
        {table: {
          widths: _.range(rows[0].length).map(i => '*'),
          body: rows
        }}
      ]
    })).download('laporan_'+title),

  regQueue: last =>
    pdfMake.createPdf(defaultStyle({
      content: [{text: last+1}],
      pageSize: 'B8'
    })).download('antrian_pendaftaran_'+(last+1)),

  radio: (identity, radiologi) =>
    pdfMake.createPdf(defaultStyle({content: [
      kop, {
        text: 'Hasil Diagnosa Radiologist',
        fontSize: 15, bold: true, alignment: 'center'
      }, '\n\n',
      {table: {widths: ['auto', '*'], body: [
        ['Nama Pasien', ': '+identity.nama_lengkap],
        ['No. MR', ': '+identity.mr_num],
        ['Petugas', ': '+lookUser(radiologi.petugas)],
        ['Kode berkas', ': '+radiologi.kode_berkas]
      ]}, layout: 'noBorders'}, '\n\n',
      radiologi.diagnosa, '\n\n\n',
      {alignment: 'justify', columns: [
        {text: '\n\n\n\n__________________\nPasien', alignment: 'center'},
        {text: 'Pangkalan Kuras, '+day(_.now())+'\n\n\n\n__________________\n'+lookUser(radiologi.petugas), alignment: 'center'}
      ]}
    ]})).download('hasil_radiologi_'+identity.mr_num+'_'+radiologi.kode_berkas),

  labor: (identity, labors) =>
    pdfMake.createPdf(defaultStyle({content: [
      kop,
      {
        text: 'Hasil Diagnosa Laborat',
        fontSize: 15, bold: true, alignment: 'center'
      }, '\n\n',
      {table: {widths: ['auto', '*'], body: [
        ['Nama uji laboratorium', 'Hasil'],
        ...labors.map(i => [
          _.get(lookReferences(i.idlabor), 'nama'),
          i.hasil
        ])
      ]}}, '\n\n\n',
      {alignment: 'justify', columns: [
        {text: '\n\n\n\n__________________\nPasien', alignment: 'center'},
        {text: 'Pangkalan Kuras, '+day(_.now())+'\n\n\n\n__________________\nPetugas', alignment: 'center'}
      ]}
    ]})).download('hasil_labor_'+identity.mr_num)
}
