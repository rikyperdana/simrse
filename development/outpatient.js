/*global _ m comp look state db ands hari state ors makePdf lookUser updateBoth makeReport makeModal withThis tds dbCall moment localStorage lookReferences reports makeIconLabel makeRincianSoapPerawat makeRincianSoapDokter*/

_.assign(comp, {
  outpatient: () => !_.includes([2, 3], state.login.peranan) ?
  m('p', 'Only for doctors and nurses') : m('.content',
    reports.outpatient(),
    m('h3', 'Clinic queue list of '+look('klinik', state.login.poliklinik)),
    m('.box', m('table.table.is-striped',
      m('thead', m('tr',
        ['Last Visit', 'MR Num.', 'Patient Name', 'Date of Birth', 'Place of Birth']
        .map(i => m('th', i))
      )),
      m('tbody',
        {onupdate: () =>
          db.patients.toArray(array =>
            state.clinicQueue = array.filter(i => withThis(
              _.last(i.rawatJalan),
              lastOne => lastOne && ands([
                // cari pasien yang belum diurus dokter klinik ini
                lastOne.klinik === state.login.poliklinik,
                !lastOne.soapDokter
              ])
            ))
          )
        },
        (state.clinicQueue || [])
        .sort((a, b) => withThis(
          obj => _.get(_.last(obj.rawatJalan), 'tanggal'),
          lastDate => lastDate(a) - lastDate(b)
        ))
        .map(i => m('tr',
          {ondblclick: () => _.assign(state, {
            route: 'onePatient', onePatient: i
          })},
          tds([
            day(_.get(_.last(i.rawatJalan), 'tanggal'), true),
            i.identity.mr_num, i.identity.full_name,
            day(i.identity.date_of_birth),
            i.identity.place_of_birth
          ])
        ))
      )
    ))
  ),

  outPatientHistory: () => m('.content',
    m('.box', m('table.table.is-striped',
      {onupdate: () => dbCall({
        method: 'findOne', collection: 'patients',
        _id: state.onePatient._id
      }, res => res && db.patients.put(res))},
      m('thead', m('tr',
        ['Visit Date', 'Clinic', 'Payment Method', 'Nurse', 'Doctor']
        .map(i => m('th', i)),
        state.login.peranan === 4 && m('th', 'Hapus')
      )),
      m('tbody',
        (_.get(state.onePatient, 'rawatJalan') || []).map(i => m('tr',
          {ondblclick: () => [
            state.modalVisit = _.includes([2, 3, 4], state.login.peranan) &&
            ors([i.cara_bayar !== 1, i.bayar_pendaftaran]) && m('.box',
              m('h3', 'Outpatient Visit Details'),
              m('table.table',
                m('tr', m('th', 'Date'), m('td', day(i.tanggal, true))),
                m('tr', m('th', 'Clinic'), m('td', look('klinik', i.klinik))),
                m('tr', m('th', 'Payment Method'), m('td', look('cara_bayar', i.cara_bayar))),
                makeRincianSoapPerawat(i.soapPerawat),
                makeRincianSoapDokter(i.soapDokter),
              ),
              m('p.buttons',
                ands([
                  state.login.peranan !== 1,
                  ors([
                    state.login.peranan === 2 && !i.soapPerawat,
                    state.login.peranan === 3 && !i.soapDokter,
                  ]),
                  m('.button.is-success',
                    {onclick: () =>_.assign(state, {
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
                ),
                _.get(i.soapDokter, 'labor') && m('.button.is-info',
                  {onclick: () => makePdf.labor(
                    state.onePatient.identity, i.soapDokter.labor
                  )}, makeIconLabel('print', 'Print Labor')
                )
              )
            )
          ]},
          tds([
            day(i.tanggal),
            look('klinik', i.klinik),
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
                state.onePatient, {rawatJalan:
                  state.onePatient.rawatJalan.filter(j =>
                    j.idrawat !== i.idrawat
                  )
                }
              ))
            ]
          }, makeIconLabel('trash-alt', 'Delete')))
        ))
      )
    )),
    m('p.help.has-text-grey-light', 'Note: Unable to open unless the self-paying patient pay first'),
    makeModal('modalVisit'),
    state.login.bidang === 1 && m('.button.is-success',
      {onclick: () => state.route = 'poliVisit'},
      makeIconLabel('file-invoice', 'Visit Clinic')
    )
  )
})
