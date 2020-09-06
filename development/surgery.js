/*global _ m comp state db tds hari lookReferences moment*/

_.assign(comp, {
  surgery: () => !ors([
    state.login.bidang === 1,
    _.includes([2, 3], state.login.peranan)
  ]) ? m('p', 'Only for registration user, nurses and doctors')
  : m('.content',
    m('h1', 'Surgery Dept. Schedules'),
    m('.box', m('table.table.is-striped',
      {
        oncreate: () =>
          db.references.toArray(array => state.references = array),
        onupdate: () =>
          db.patients.toArray(array => state.surgeryList = array.map(i =>
            [...(i.rawatJalan || []), ...(i.emergency || [])].flatMap(j =>
              j && j.soapDokter && j.soapDokter.tindakan &&
              j.soapDokter.tindakan.map(k =>
                (k.jadwal > +moment()) && _.merge(i, j, k)
              ).filter(Boolean)
            ).filter(Boolean)
          ).filter(x => x.length))
      },
      m('tr', ['Patient Name', 'Surgery Schedul', 'Action Name'].map(i => m('th', i))),
      state.surgeryList && _.flatten(state.surgeryList).map(i => m('tr', tds([
        i.identity.full_name,
        day(i.jadwal, true),
        lookReferences(i.idtindakan).nama
      ])))
    ))
  )
})
