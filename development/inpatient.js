/*global _ m comp db state ands updateBoth randomId look hari makeModal lookUser lookReferences lookGoods selects makePdf makeReport withThis tds rupiah autoForm moment schemas reports makeIconLabel ors makeRincianSoapPerawat makeRincianSoapDokter*/

_.assign(comp, {
  inpatient: () => !_.includes([2, 3], state.login.peranan) ?
  m('p', 'Only for doctors and nurses') : m('.content',
    reports.inpatient(),
    m('h3', 'Admission list for inpatients'),
    m('.box', m('table.table.is-striped',
      {onupdate: () =>
        db.patients.toArray(array =>
          state.admissionList = _.compact(array.flatMap(i =>
            // permintaan rawat inap bisa dari rawat jalan maupun IGD
            [...(i.rawatJalan || []), ...(i.emergency || [])]
            .flatMap(j => ands([
              // cari pasien yang ditunjuk dokter untuk diinapkan
              _.get(j, 'soapDokter.keluar') === 3,
              // dan belum ada rekaman admisi ke rawat inap
              (i.rawatInap || []).filter(k =>
                k.idrawat === j.idrawat
              ).length === 0,
              {pasien: i, inap: j}
            ]))
          ))
        )
      },
      m('thead', m('tr',
        ['MR Num.', 'Patient Name', 'Admission Date', 'Admission source', 'Admitting Doctor']
        .map(i => m('th', i))
      )),
      m('tbody',
        (state.admissionList || [])
        .sort((a, b) => withThis(
          obj => _.get(obj.inap, 'tanggal'),
          tanggal => tanggal(a) - tanggal(b)
        )
      )
      .map(i => m('tr',
        {ondblclick: () => [
          state.admissionModal = m('.box',
            m('h4', 'Inapkan pasien'),
            m('table.table',
              [
                ['Full Name', i.pasien.identity.mr_num],
                ['Payment method', look('cara_bayar', i.inap.cara_bayar)],
                ['Nurse Anamnese', _.get(i, 'inap.soapPerawat.anamnesa')],
                ['Doctor Anamnese', _.get(i, 'inap.soapDokter.anamnesa')],
              ].map(j => m('tr', m('th', j[0]), m('td', j[1]))),
            ),
            m(autoForm({
              id: 'formBed', schema: schemas.beds,
              action: doc => [
                updateBoth(
                  'patients', i.pasien._id, _.assign(i.pasien, {rawatInap: [
                    ...(i.pasien.rawatInap || []),
                    {
                      // buatkan record rawatInap dengan observasi kosong
                      tanggal_masuk: _.now(), dokter: i.inap.soapDokter.dokter,
                      observasi: [], idinap: randomId(), idrawat: i.inap.idrawat,
                      cara_bayar: i.inap.cara_bayar, bed: doc
                    }
                  ]})
                ),
                _.assign(state, {admissionList: null, admissionModal: null}),
                m.redraw()
              ]
            }))
          ), m.redraw()
        ]},
        tds([
          i.pasien.identity.mr_num,
          i.pasien.identity.full_name,
          day(i.inap.tanggal, true),
          _.get(i.inap, 'klinik') ? 'Outpatient' : 'Emergency',
          lookUser(_.get(i.inap, 'soapDokter.dokter'))
        ])
      )))
    )),
    makeModal('admissionModal'),
    m('br'),

    m('h3', 'Inpatient in ward'),
    m('p.help', '* Sort by latest entry'),
    m('.box', m('table.table.is-striped',
      {onupdate: () =>
        db.patients.toArray(array => [
          state.inpatientList = array.filter(i =>
            i.rawatInap && i.rawatInap
            // cari pasien yg belum keluar dari rawat inap
            .filter(j => !j.keluar).length > 0
          ), m.redraw()
        ]),
      },
      m('thead', m('tr',
        ['MR Num.', 'Patient Name', 'Class / Room / Bed Num', 'Entry date']
        .map(i => m('th', i))
      )),
      m('tbody',
        (state.inpatientList || [])
        .sort((a, b) => withThis(
          obj => _.get(_.last(obj.rawatInap), 'tanggal_masuk'),
          lastDate => lastDate(b) - lastDate(a)
        ))
        .map(i => withThis(
          _.get(_.last(i.rawatInap), 'bed'),
          bed => bed && m('tr',
            {ondblclick: () => _.assign(state, {
              route: 'onePatient', onePatient: i,
              onePatientTab: 'inpatient'
            })},
            tds([
              i.identity.mr_num,
              i.identity.full_name,
              [
                _.upperCase(bed.kelas),
                _.startCase(bed.kamar),
                bed.nomor
              ].join(' / '),
              day(_.get(_.last(i.rawatInap), 'tanggal_masuk'), true)
            ])
          )
        ))
      )
    ))
  ),

  inpatientHistory: () => m('.content',
    m('.box', m('table.table.is-striped',
      m('thead', m('tr',
        ['Entry date', 'Class / Room / Bed Num.']
        .map(i => m('th', i))
      )),
      m('tbody',
        (state.onePatient.rawatInap || []).map(i => m('tr',
          {ondblclick: () =>
             // untuk melihat 1 rekaman observasi
            state.modalObservasi = _.includes([2, 3, 4], state.login.peranan) && m('.box',
              m('h3', 'Observation History'),
              Boolean(i.observasi.length) && m(
                'p.help.is-italic.has-text-info',
                'double-click on any observation for details'
              ),
              m('table.table',
                m('thead', m('tr',
                  ['Time', 'Anamnese', 'Medic']
                  .map(j => m('th', j))
                )),
                m('tbody', i.observasi.map(j => m('tr',
                  {ondblclick: () => [
                    state.modalObservasi = null,
                    state.modalSoap = m('.box',
                      m('h4', 'SOAP Details'),
                      m('table.table',
                        m('tr', m('th', 'Observation Time'), m('td', day(j.tanggal, true))),
                        j.diagnosa ? makeRincianSoapDokter(j) : makeRincianSoapPerawat(j)
                      ),
                      m('.button.is-info',
                        {onclick: () => makePdf.soap(
                          state.onePatient.identity,
                          j.perawat ? {soapPerawat: j} : {soapDokter: j}
                        )},
                        makeIconLabel('print', 'Print SOAP')
                      )
                    ), m.redraw()
                  ]},
                  tds([
                    day(j.tanggal), j.anamnesa,
                    lookUser(j.perawat || j.dokter)
                  ])
                )))
              ),
              !i.keluar && m('p.buttons',
                m('.button.is-success',
                  {onclick: () => [
                    _.assign(state, {
                      // alihkan ke halaman formSoap di patient.js dengan membawa dokumen oneInap
                      route: 'formSoap', oneInap: i, modalObservasi: null
                    }), m.redraw()
                  ]},
                  makeIconLabel('user-md', 'Add Observation')
                ),
                m('.button.is-danger',
                  {ondblclick: () => [
                    updateBoth('patients', state.onePatient._id, _.assign(
                      state.onePatient, {rawatInap:
                        state.onePatient.rawatInap.map(j =>
                          j.idinap === i.idinap ?
                          _.assign(j, {keluar: _.now()}) : j
                        )
                      }
                    )),
                    state.modalObservasi = null,
                    m.redraw()
                  ]},
                  makeIconLabel('door-open', 'Discharge Patient')
                )
              )
            )
          },
          makeModal('modalSoap'),
          tds([
            day(i.tanggal_masuk),
            i.bed && [
              _.upperCase(i.bed.kelas),
              _.startCase(i.bed.kamar),
              i.bed.nomor
            ].join(' / ')
          ])
        ))
      )
    )),
    makeModal('modalObservasi')
  ),

  beds: () => !ors([
    _.includes([2, 3], state.login.peranan),
    _.includes([1], state.login.bidang)
  ]) ? m('p', 'Only for nurses and doctors') : m('.content',
    m('h3', 'Available beds list'),
    m('.box', m('table.table.is-striped',
      {onupdate: () =>
        db.patients.toArray(array => [
          state.inpatientList = array.filter(i =>
            i.rawatInap && i.rawatInap
            // cari pasien yg belum keluar dari rawat inap
            .filter(j => !j.keluar).length > 0
          ), m.redraw()
        ]),
      },
      m('tr', ['Class', 'Room', 'Bed Num.', 'Patient'].map(i => m('th', i))),
      state.inpatientList && _.flattenDepth(
        _.map(beds, (i, j) => _.map(
          i.kamar, (k, l) => _.range(k).map(m => [
            j, l, m+1, _.get(state.inpatientList.find(
              n => n.rawatInap.find(
                o => o.bed && ands([
                  o.bed.kelas === j,
                  o.bed.kamar === l,
                  o.bed.nomor === m+1
                ])
              )
            ), 'identity.full_name')
          ])
        )), 2
      ).map(p => m('tr', p.map(
        q => m('td', _.upperCase(q))
      )))
    ))
  ),
})

var beds = {
  vip: {tarif: 350, kamar: {tulip: 1, bougenvil: 1, sakura: 1}},
  kl1: {tarif: 200, kamar: {kenanga: 2, cempaka: 2, claudia: 2, ferbia: 2, yasmin: 2, edelwise: 2}},
  kl2: {tarif: 150, kamar: {seroja: 3, mawar: 2, dahlia: 2, lili: 2, zahara: 2, matahari: 4}},
  kl3: {tarif: 100, kamar: {anggrek: 4, teratai: 7, kertas: 3, melati: 5}}
}
