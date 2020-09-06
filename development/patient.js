/*global _ m comp state db hari look moment makePdf ors ands state autoForm schemas updateBoth state randomId withThis makeModal makeIconLabel*/

_.assign(comp, {
  onePatient: () => withThis(
    state.onePatient.identity,
    id => m('.content',
      {onupdate: () => [
        db.references.toArray(array => state.references = array),
        db.goods.toArray(array => state.goodsList = array),
        db.users.toArray(array => state.userList = array)
      ]},
      m('h3', 'Patient Medical Record'),
      m('.box', m('table.table.is-striped', _.chunk([
        ['MR Num.', id.mr_num],
        ['Full Name', id.nama_lengkap],
        ['Date of Birth', day(id.tanggal_lahir)],
        ['Place of Birth', id.tempat_lahir],
        ['Gender', look('kelamin', id.kelamin)],
        ['Religion', look('agama', id.agama)],
        ['Marital Status', look('nikah', id.nikah)],
        ['Last Education', look('pendidikan', id.pendidikan)],
        ['Bloody Type', look('darah', id.darah)],
        ['Current Occupation', look('pekerjaan', id.pekerjaan)],
        ['Home Address', id.tempat_tinggal],
        ['Age', moment().diff(id.tanggal_lahir, 'years')+' tahun'],
        ['Father Name', id.keluarga.ayah],
        ['Mother Name', id.keluarga.ibu],
        ['Spouse Name', id.keluarga.pasangan],
        ['Phone Num.', id.kontak]
      ], 4).map(i => m('tr', i.map(j =>
        [m('th', j[0]), m('td', j[1])]
      ))))),
      m('p.buttons',
        [
          {
            label: 'Member Card', icon: 'id-card', color: 'info',
            click: () => makePdf.card(id)
          },
          {
            label: 'General consent', icon: 'file-contract', color: 'info',
            click: () => makePdf.consent(id)
          },
          {
            label: 'Update Patient', icon: 'edit', color: 'warning',
            click: () => state.route = 'updatePatient'
          },
          {
            label: 'SOAP History', icon: 'bars', color: 'info',
            click: () => state.modalRekapSoap = m('.box',
              m('h3', 'Patient SOAP Summary'),
              m('p.help', 'Chronologically sorted'),
              [
                ...(state.onePatient.rawatJalan || []),
                ...(state.onePatient.emergency || []),
              ].map(i => m('table.table',
                i.soapPerawat && i.soapDokter && [
                  ['Visit Date', day(i.tanggal, true)],
                  ['Service', i.klinik ? look('klinik', i.klinik) : 'Emergency'],
                  ['Nurse Anamnese', i.soapPerawat.anamnesa],
                  ['Doctor Diagnosys', i.soapDokter.diagnosa.map(i => i.text).join(', ')]
                ].map(j => m('tr', m('th', j[0]), m('td', j[1])))
              ))
            )
          }
        ]
        .map(i => m('.button.is-'+i.color,
          {onclick: i.click},
          makeIconLabel(i.icon, i.label)
        ))
      ),
      makeModal('modalRekapSoap'),
      m('.tabs.is-boxed', m('ul',
        {style: 'margin-left: 0%'},
        _.map({
          outpatient: ['Outpatient History', 'walking'],
          emergency: ['Emergency History', 'ambulance'],
          inpatient: ['Inpatient History', 'bed']
        }, (val, key) => m('li',
          {class: ors([
            key === state.onePatientTab,
            ands([
              !state.onePatientTab,
              _.get(state, 'login.poliklinik'),
              key === 'outpatient'
            ])
          ]) && 'is-active'},
          m('a',
            {onclick: () => [state.onePatientTab = key, m.redraw()]},
            makeIconLabel(val[1], val[0])
          )
        ))
      )),
      m('div', ({
        outpatient: comp.outPatientHistory(),
        emergency: comp.emergencyHistory(),
        inpatient: comp.inpatientHistory()
      })[state.onePatientTab || ors([
        _.get(state, 'login.poliklinik') && 'outpatient'
      ])])
    )
  ),

  formSoap: () => m('.content',
    {
      onupdate: () => [
        db.goods.toArray(array => _.assign(state, {
          goodsList: array,
          drugList: array.filter(i => ands([
            i.jenis === 1,
            i.batch.filter(j => ands([
              j.stok.apotik,
              j.kadaluarsa > _.now()
            ])).length
          ])),
          bhpList: array.filter(i => i.jenis === 2),
        })),
        db.references.filter(i => _.every([
          i[0] === 'rawatJalan',
          i[1] === _.snakeCase(look(
            'klinik', state.login.poliklinik
          ))
        ]))
        .toArray(array => state.daftarTindakan = array),
        db.references.filter(i => i[0] === 'radiologi')
        .toArray(array => state.daftarRadio = array),
        state.spm = _.now()
      ]
    },
    m('h3', 'SOAP Form'),
    m(autoForm({
      id: 'soapMedis', autoReset: true,
      confirmMessage: 'Are you sure to commit this SOAP?',
      schema: ors([
        state.login.peranan === 2 && schemas.soapPerawat,
        state.login.peranan === 3 && ors([
          state.oneInap && _.merge(
            _.omit(schemas.soapDokter, ['rujuk', 'keluar']),
            schemas.gizi
          ),
          schemas.soapDokter
        ])
      ]),
      action: doc => withThis(
        ands([
          !_.get(state, 'oneInap'),
          _.get(state, 'oneRawat.klinik') ? 'rawatJalan' : 'emergency',
        ]),
        facility => [
          // jika berasal dari rawat jalan atau IGD
          facility && updateBoth('patients', state.onePatient._id, _.assign(
            state.onePatient, {[facility]: state.onePatient[facility].map(i =>
              i.idrawat === state.oneRawat.idrawat ?
              _.merge(state.oneRawat, ors([
                state.login.peranan === 2 && {soapPerawat: doc},
                state.login.peranan === 3 && {soapDokter: doc}
              ])) : i
            )}
          )),
          // jika berasal dari observasi rawat inap
          state.oneInap && updateBoth('patients', state.onePatient._id, _.assign(
            state.onePatient, {rawatInap:
              state.onePatient.rawatInap.map(i =>
                i.idinap === state.oneInap.idinap ?
                _.assign(state.oneInap, {observasi:
                  state.oneInap.observasi.concat([_.merge(
                    doc, {tanggal: _.now(), idobservasi: randomId()}
                  )])
                }) : i
              )
            }
          )),
          // jika ada rujuk konsul maka regiskan pasien dengan ikut cara bayar awal
          ands([doc.keluar === 2, doc.rujuk]) &&
          updateBoth('patients', state.onePatient._id, _.assign(state.onePatient, {
            rawatJalan: [...(state.onePatient.rawatJalan || []), _.assign(
              _.pick(state.oneRawat, ['cara_bayar', 'sumber_rujukan', 'penanggungjawab', 'no_sep']),
              {idrawat: randomId(), tanggal: _.now(), klinik: doc.rujuk}
            )]
          })),
          _.assign(state, {route: 'onePatient', oneRawat: null, oneInap: null}),
          m.redraw()
        ]
      )
    }))
  )
})
