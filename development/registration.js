/*global _ comp m state db hari autoForm schemas insertBoth updateBoth randomId tds withThis ands startOfTheDay moment makeIconLabel*/

_.assign(comp, {
  registration: () => state.login.bidang !== 1 ?
  m('p', 'Only for registration user') : m('.content',
    m('h1', 'Patient Search'),
    m('.control.is-expanded', m('input.input.is-fullwidth', {
      type: 'text', placeholder: 'Find by Full Name or MR Num.',
      onkeypress: e => [
        ands([
          e.key === 'Enter',
          e.target.value.length > 3
        ]) && [
          state.loading = true, m.redraw(),
          db.patients.filter(i => _.includes(
            _.lowerCase(i.identitas.nama_lengkap)+i.identitas.no_mr,
            e.target.value
          )).toArray(array => [
            _.assign(state, {
              searchPatients: array,
              loading: false
            }), m.redraw()
          ])
        ]
      ]
    })), m('br'),
    state.loading && m('progress.progress.is-small.is-primary'),
    state.searchPatients && m('p.help', '* Sorted by Date of Birth'),
    m('.box', m('table.table.is-striped',
      m('thead', m('tr',
        ['Last Visit', 'MR Num.', 'Full Name', 'Date of Birth', 'Place of Birth']
        .map(i => m('th', i))
      )),
      m('tbody',
        (state.searchPatients || [])
        .sort((a, b) => a.identitas.tanggal_lahir - b.identitas.tanggal_lahir)
        .map(i => m('tr',
          {ondblclick: () => _.assign(state, {
            route: 'onePatient', onePatient: i
          })},
          tds([
            day(_.get(_.last([...(i.rawatJalan || []), ...(i.emergency || [])]), 'tanggal')),
            i.identitas.no_mr, i.identitas.nama_lengkap,
            day(i.identitas.tanggal_lahir), i.identitas.tempat_lahir
          ])
        ))
      )
    )),
    state.searchPatients &&
    m('.button.is-primary',
      {onclick: () => _.assign(state, {
        route: 'newPatient', searchPatients: null
      })},
      makeIconLabel('user-plus', 'New Patient')
    )
  ),

  newPatient: () => m('.content',
    m('h3', 'New Patient Registration'),
    m(autoForm({
      id: 'newPatient', schema: schemas.identitas,
      confirmMessage: 'Are you sure to register NEW patient?',
      action: doc => withThis(
        {identitas: doc, _id: randomId()}, obj => [
          insertBoth('patients', obj),
          doc.no_antrian && db.queue.toArray(arr => withThis(
            arr.find(i => i.no_antrian === doc.no_antrian),
            obj => updateBoth('queue', obj._id, _.merge(obj, {done: true}))
          )),
          _.assign(state, {route: 'onePatient', onePatient: obj})
        ]
      ),
    }))
  ),

  updatePatient: () => m('.content',
    m('h3', 'Update Patient Identity'),
    m(autoForm({
      id: 'updatePatient', schema: schemas.identitas,
      doc: state.onePatient.identitas,
      action: doc => [
        updateBoth(
          'patients', state.onePatient._id,
          _.assign(state.onePatient, {identitas: doc})
        ), state.route = 'onePatient', m.redraw()
      ]
    }))
  ),

  poliVisit: () => m('.content',
    m('h3', 'Clinic Registration Form'),
    m('.box', m(autoForm({
      id: 'poliVisit', autoReset: true,
      schema: schemas.rawatJalan,
      confirmMessage: 'Are you sure to register the patient to this clinic?',
      action: doc => db.patients.filter(i =>
        i.rawatJalan && i.rawatJalan.filter(j => ands([
          j.klinik === 1,
          j.tanggal > startOfTheDay(+moment())
        ])).length
      ).toArray(array => [
        updateBoth('patients', state.onePatient._id, _.assign(
          state.onePatient, {rawatJalan: [
            ...(state.onePatient.rawatJalan || []),
            _.merge(doc, {antrian: array.length+1})
          ]}
        )),
        doc.no_antrian && db.queue.toArray(arr => withThis(
          arr.find(i => i.no_antrian === doc.no_antrian),
          obj => updateBoth('queue', obj._id, _.merge(obj, {done: true}))
        )),
        state.route = 'onePatient',
        m.redraw()
      ])
    })))
  )
})
