/*global _ m comp tds*/

_.assign(comp, {
  gizi: () => state.login.bidang !== 10
  ? m('p', 'Only for nutrition department users')
  : m('.content',
    m('h1', 'Inpatient Consumption List'),
    m('.box', m('table.table.is-striped',
      {oncreate: () => db.patients.filter(
        i => (i.rawatInap || []).filter(
          j => j.observasi && !j.keluar
        ).length
      ).toArray(array => [
        state.consumeList = array,
        m.redraw()
      ])},
      m('thead', m('tr',
        m('th', 'Patient Name'),
        m('th', 'Entry Date')
      )),
      m('tbody', (state.consumeList || []).map(
        i => m('tr', {onclick: () => [
          state.modalConsume = m('.box',
            m('h3', 'Nutritional Need Details'),
            m('table.table',
              m('tr',
                m('th', 'Patient Name'),
                m('td', i.identity.full_name)
              ),
              withThis(_.last(i.rawatInap), inap => [
                m('tr',
                  m('th', 'Entry Date'),
                  m('td', day(inap.tanggal_masuk, true))
                ),
                m('tr', m('th', 'Class/Room/Bed'), m('td', [
                  _.upperCase(inap.bed.kelas),
                  _.startCase(inap.bed.kamar),
                  inap.bed.nomor
                ].join('/'))),
                inap.observasi.map(j => j.konsumsi && m('tr', tds([
                  day(j.tanggal, true),
                  [lookUser(j.dokter), j.konsumsi].join(': ')
                ])))
              ]),
            )
          )
        ]}, tds([
          i.identity.full_name,
          day(_.get(_.last(i.rawatInap), 'tanggal_masuk'), true)
        ]))
      ))
    )),
    makeModal('modalConsume')
  )
})
