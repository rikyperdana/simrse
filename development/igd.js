/*global _ comp m db state hari look ands ors lookUser makeModal updateBoth autoForm schemas makePdf makeReport withThis tds moment reports makeIconLabel makeRincianSoapPerawat makeRincianSoapDokter*/

_.assign(comp, {
  emergency: () => !_.includes([2, 3], state.login.peranan) ?
  m('p', 'Only for nurses and doctors') : m('.content',
    {onupdate: () =>
      db.patients.toArray(array =>
        state.emergencyList = array.filter(i =>
          i.emergency && i.emergency.filter(j =>
            !j.soapDokter
          ).length > 0
        )
      )
    },
    reports.igd(),
    m('h3', 'Emergency Unit'),
    m('.box', m('table.table.is-striped',
      m('thead', m('tr',
        ['No. MR', 'Nama Pasien', 'Jam Masuk']
        ['MR Num', 'Patient Name', 'Entry Time']
        .map(i => m('th', i))
      )),
      m('tbody',
        state.emergencyList && state.emergencyList
        .sort((a, b) => withThis(
          obj => _.get(_.last(obj.emergency), 'tanggal'),
          lastDate => lastDate(a) - lastDate(b)
        ))
        .map(i => m('tr',
          {ondblclick: () => [
            _.assign(state, {
              route: 'onePatient', onePatient: i, onePatientTab: 'emergency'
            }),
            m.redraw()
          ]},
          m('td', i.identity.mr_num),
          m('td', i.identity.nama_lengkap),
          m('td', day(_.get(_.last(i.emergency), 'tanggal'), true))
        ))
      )
    ))
  ),
  emergencyHistory: () => m('.content',
    m('.box', m('table.table',
      m('thead', m('tr',
        ['Entry Time', 'Payment Method', 'Nurse', 'Doctor']
        .map(i => m('th', i)),
        state.login.peranan === 4 && m('th', 'Hapus')
      )),
      m('tbody',
        (_.get(state, 'onePatient.emergency') || [])
        .map(i => m('tr',
          {ondblclick: () =>
            state.modalVisit = m('.box',
              m('h4', 'Emergency Visit Details'),
              m('table.table',
                m('tr', m('th', 'Entry Time'), m('td', day(i.tanggal))),
                m('tr', m('th', 'Payment Method'), m('td', look('cara_bayar', i.cara_bayar))),
                m('tr', m('th', 'Nurse'), m('td', lookUser(_.get(i, 'soapPerawat.perawat')))),
                m('tr', m('th', 'Doctor'), m('td', lookUser(_.get(i, 'soapDokter.dokter')))),
                makeRincianSoapPerawat(i.soapPerawat),
                makeRincianSoapDokter(i.soapDokter)
              ),
              m('p.buttons',
                ands([
                  state.login.peranan !== 1,
                  ors([
                    state.login.peranan === 2 && !i.soapPerawat,
                    state.login.peranan === 3 && !i.soapDokter,
                  ]),
                  m('.button.is-success',
                    {onclick: () => _.assign(state, {
                      route: 'formSoap', oneRawat: i, modalVisit: null
                    })},
                    makeIconLabel(
                      'user-md',
                      state.login.peranan === 3 ?
                      'Doctor SOAP' : 'Nurse SOAP'
                    )
                  )
                ]),
                m('.button.is-info',
                  {onclick: () => makePdf.soap(state.onePatient.identity, i)},
                  makeIconLabel('print', 'Print SOAP')
                )
              )
            )
          },
          tds([
            day(i.tanggal),
            look('cara_bayar', i.cara_bayar),
            lookUser(_.get(i, 'soapPerawat.perawat')),
            lookUser(_.get(i, 'soapDokter.dokter'))
          ]),
          ands([
            state.login.peranan === 4,
            !i.bayar_konsultasi
          ]) && m('td', m('.button.is-danger', {
            'data-tooltip': 'double-click if sure to delete',
            ondblclick: e => [
              e.stopPropagation(),
              updateBoth('patients', state.onePatient._id, _.assign(
                state.onePatient, {emergency:
                  state.onePatient.emergency.filter(j =>
                    j.idrawat !== i.idrawat
                  )
                }
              ))
            ]
          }, makeIconLabel('trash-alt', 'Delete')))
        ))
      )
    )),
    state.login.bidang === 1 && m('.button.is-success',
      {onclick: () => state.route = 'igdVisit'},
      makeIconLabel('file-invoice', 'Visit Emergency')
    ),
    makeModal('modalVisit')
  ),

  igdVisit: () => m('.content',
    m('h3', 'Emergency Registration Form'),
    m('.box', m(autoForm({
      id: 'igdVisit', autoReset: true,
      schema: _.omit(schemas.rawatJalan, 'klinik'),
      confirmMessage: 'Are you sure to register this patient to Emergency?',
      action: doc => [
        updateBoth('patients', state.onePatient._id, _.assign(
          state.onePatient, {emergency:
            [...(_.get(state, 'onePatient.emergency') || []), doc]
          }
        )),
        state.route = 'onePatient',
        m.redraw()
      ]
    })))
  )
})
