/*global pdfMake hari _ ors lookUser hari rupiah look lookReferences moment state lookGoods tarifInap withThis beds tarifIGD tarifKartu localStorage defaultStyle*/

var kop = {text: 'RUMAH SAKIT MEDICARE\nJL. Dt. Laksamana No. 1, Pangkalan Kuras, Pelalawan, Provinsi Riau.\n\n', alignment: 'center', bold: true},
makePdf = {
  card: identitas =>
    pdfMake.createPdf(defaultStyle({
      content: [
        'Nama: '+identitas.nama_lengkap,
        'No. MR: '+identitas.no_mr
      ],
      pageSize: 'B8',
      pageMargins: [110, 50, 0, 0],
      pageOrientation: 'landscape'
    })).download('kartu_peserta_'+identitas.no_mr),

  consent: identitas =>
    pdfMake.createPdf(defaultStyle({content: [
      kop,
      {text: 'Data Umum Pasien\n', alignment: 'center'},
      {columns: [
        ['No. MR', 'Nama Lengkap', 'Tempat & Tanggal Lahir', 'Nama Ibu', 'Alamat', 'Kontak'],
        [
          identitas.no_mr,
          identitas.nama_lengkap,
          (identitas.tempat_lahir || '')+', '+hari(identitas.tanggal_lahir),
          _.get(identitas.keluarga, 'ibu') || '',
          identitas.tempat_tinggal || '',
          identitas.kontak || ''
        ].map(i => ': '+i)
      ]},
      {text: '\nPersetujuan Umum General Consent\n', alignment: 'center'},
      {table: {body: [
        ['S', 'TS', {text: 'Keterangan', alignment: 'center'}],
        ['', '', 'Saya akan mentaati peraturan yang berlaku di RS Medicare.'],
        ['', '', 'Saya memberi kuasa kepada dokter dan semua tenaga kesehatan untuk melakukan pemeriksaan / pengobatan / tindakan yang diperlukan dalam upaya kesembuhan saya / pasien tersebut diatas.'],
        ['', '', 'Saya memberi kuasa kepada dokter dan semua tenaga kesehatan yang ikut merawat saya untuk memberikan keterangan medis saya kepada yang bertanggungjawab atas biaya perawatan saya.'],
        ['', '', 'Saya memberi kuasa kepada RS Medicare untuk menginformasikan identitas sosial saya kepada keluarga / rekan / masyarakat.'],
        ['', '', 'Saya mengatakan bahwa informasi hasil pemeriksaan / rekam medis saya dapat digunakan untuk pendidikan / penelitian demi kemajuan ilmu kesehatan.']
      ]}},
      '\nPetunjuk :\nS: Setuju\nTS: Tidak Setuju',
      {alignment: 'justify', columns: [
        {text: '\n\n\n\n__________________\n'+state.login.nama, alignment: 'center'},
        {text: 'Pangkalan Kuras, '+hari(_.now())+'\n\n\n\n__________________\nPasien', alignment: 'center'}
      ]}
    ]})).download('general_consent_'+identitas.no_mr),

  bayar_pendaftaran: (pasien, rawat, rawatLength) =>
    pdfMake.createPdf(defaultStyle({content: [kop, {columns: [
      ['Tanggal', 'No. MR', 'Nama Pasien', 'Tarif', 'Petugas'],
      [
        hari(_.now()),
        pasien.identitas.no_mr,
        pasien.identitas.nama_lengkap,
        'Total: '+rupiah(_.sum([
          rawatLength > 1 ? 0 : tarifKartu,
          1000 * +look('tarif_klinik', rawat.klinik)
        ])),
        state.login.nama
      ].map(i => ': '+i)
    ]}]})).download('bayar_pendaftaran_'+pasien.identitas.no_mr),

  bayar_konsultasi: (pasien, rawat, bills) =>
    pdfMake.createPdf(defaultStyle({content: [
      kop,
      {columns: [
        ['No. MR', 'Nama Pasien', 'Jenis Kelamin', 'Tanggal Lahir', 'Umur', 'Layanan'],
        [
          pasien.identitas.no_mr,
          _.startCase(pasien.identitas.nama_lengkap),
          look('kelamin', pasien.identitas.kelamin) || '-',
          hari(pasien.identitas.tanggal_lahir),
          moment().diff(pasien.identitas.tanggal_lahir, 'years')+' tahun',
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
        [...bills].map(i => [i.item, rupiah(i.harga)])
      )}},
      '\nTotal Biaya '+rupiah(_.sum(bills.map(i => i.harga))),
      {text: '\nP. Kuras, '+hari(_.now())+'\n\n\n\n\nPetugas', alignment: 'right'}
    ]})).download('bayar_konsultasi_'+pasien.identitas.no_mr),

  soap: (identitas, rawat) =>
    pdfMake.createPdf(defaultStyle({content: [
      kop,
      {table: {widths: ['auto', '*', 'auto'], body: [
        [
          'Nama: '+identitas.nama_lengkap,
          'Tanggal lahir: '+hari(identitas.tanggal_lahir),
          'No. MR: '+identitas.no_mr
        ],
        [
          'Kelamin: '+look('kelamin', identitas.kelamin),
          'Tanggal kunjungan: '+hari(ors([
            rawat.tanggal, rawat.tanggal_masuk,
            _.get(rawat, 'soapDokter.tanggal')
          ])),
          'Gol. Darah: '+look('darah', identitas.darah)],
        [
          'Klinik: '+look('klinik', rawat.klinik),
          'Tanggal cetak: '+hari(_.now()),
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
    ]})).download('soap_'+identitas.no_mr),

  resep: (drugs, no_mr) =>
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
            i.puyer || '-', rupiah(i.harga || i.jual)
          ]),
          ['Total', '', '', '', '', rupiah(_.sum(drugs.map(i => i.harga || i.jual)))]
        ]
      }},
      {alignment: 'justify', columns: [
        {text: '', alignment: 'center'},
        {text: '\nPangkalan Kuras, '+hari(_.now())+'\n\n\n\n__________________\n'+state.login.nama, alignment: 'center'}
      ]},
      {text: '\n\n-------------------------------------potong disini------------------------------------------', alignment: 'center'},
      {text: '\nInstruksi penyerahan obat'},
      {table: {body: [
        ['Nama Barang', 'No. Batch', 'Jumlah'],
        ...drugs.map(i => [i.nama_barang, i.no_batch, i.serahkan])
      ]}}
    ]})).download('salinan_resep_'+no_mr),

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

  radio: (identitas, radiologi) =>
    pdfMake.createPdf(defaultStyle({content: [
      kop, {
        text: 'Hasil Diagnosa Radiologist',
        fontSize: 15, bold: true, alignment: 'center'
      }, '\n\n',
      {table: {widths: ['auto', '*'], body: [
        ['Nama Pasien', ': '+identitas.nama_lengkap],
        ['No. MR', ': '+identitas.no_mr],
        ['Petugas', ': '+lookUser(radiologi.petugas)],
        ['Kode berkas', ': '+radiologi.kode_berkas]
      ]}, layout: 'noBorders'}, '\n\n',
      radiologi.diagnosa, '\n\n\n',
      {alignment: 'justify', columns: [
        {text: '\n\n\n\n__________________\nPasien', alignment: 'center'},
        {text: 'Pangkalan Kuras, '+hari(_.now())+'\n\n\n\n__________________\n'+lookUser(radiologi.petugas), alignment: 'center'}
      ]}
    ]})).download('hasil_radiologi_'+identitas.no_mr+'_'+radiologi.kode_berkas),

  labor: (identitas, labors) =>
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
        {text: 'Pangkalan Kuras, '+hari(_.now())+'\n\n\n\n__________________\nPetugas', alignment: 'center'}
      ]}
    ]})).download('hasil_labor_'+identitas.no_mr)
}
