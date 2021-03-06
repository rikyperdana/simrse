/*global _ m comp state autoForm schemas insertBoth makeModal db updateBoth look paginate rupiah Papa ors randomId tds dbCall withThis moment io menus betaMenus makeIconLabel*/

_.assign(comp, {
  users: () => state.login.bidang !== 5 ?
  m('p', 'Only for management user') : m('.content',
    m('h3', 'Accounts Management'),
    m('.button.is-primary',
      {onclick: () =>
        state.modalAccount = m('.box',
          m('h3', 'Add Account'),
          m(autoForm({
            id: 'createAccount', schema: schemas.account,
            action: doc =>
              io().emit('bcrypt', doc.password, res => [
                insertBoth('users', _.assign(doc, {password: res})),
                state.modalAccount = null
              ])
          }))
        )
      },
      makeIconLabel('user-plus', 'Add Account')
    ), m('br'), m('br'),
    makeModal('modalAccount'),
    m('.box', m('table.table.is-striped',
      {onupdate: () => db.users.toArray(array => [
        state.userList = array, m.redraw()
      ])},
      m('thead', m('tr',
        ['Nama lengkap', 'Username', 'Peranan', 'Bidang', 'Poliklinik']
        ['Full Name', 'Username', 'Role', 'Department', 'Clinic']
        .map(i => m('th', i)))
      ),
      m('tbody', (state.userList.filter(i =>
        i.keaktifan === 1
      ) || []).map(i =>
        m('tr',
          {ondblclick: () =>
            state.modalAccount = m('.box',
              m('h4', 'User Profile'),
              m(autoForm({
                id: 'updateAccount', schema: schemas.account, doc: i,
                action: doc =>
                  io().emit('bcrypt', doc.password, res => [
                    updateBoth('users', i._id, _.assign(doc, {password: res})),
                    state.modalAccount = null, m.redraw()
                  ])
              }))
            )
          },
          tds([
            i.nama, i.username,
            look('peranan', i.peranan),
            look('bidang', i.bidang),
            look('klinik', i.poliklinik),
          ])
        )
      ))
    ))
  ),

  // referensi harus terbuka untuk seluruh pihak
  references: () => m('.content',
    m('h3', 'Fee List'),
    m('p.help', '* Sorted Alphabetically'),
    m('.box', m('table.table.is-striped',
      {oncreate: () => db.references.toArray(array => [
        state.referenceList = _.sortBy(array, ['nama']),
        m.redraw()
      ])},
      m('thead', m('tr',
        ['Nama item', 'Harga', 'Grup 1', 'Grup 2', 'Grup 3']
        ['Item Name', 'Price', 'Group 1', 'Group 2', 'Group 3']
        .map(i => m('th', i))
      )),
      m('tbody',
        paginate(state.referenceList || [], 'references', 20)
        .map(i => i.nama && m('tr', tds([
          i.nama, currency(i.harga), i[0], i[1], i[2]
        ])))
      )
    )),
    m('div',comp.pagination(
      'references',
      _.get(state, 'referenceList.length') / 20
    )),
    ands([
      state.login.bidang === 5,
      state.login.peranan === 4
    ]) && [
      m('h3', 'Data Import'),
      m('.file.is-danger',
        {onchange: e => Papa.parse(e.target.files[0], {
          header: true, complete: result => withThis(
            (collName, docs) => [
              dbCall({
                method: 'insertMany', collection: collName, documents: docs
              }, () => ''),
              db[collName].bulkPut(docs).then(last =>
                last && alert('Successfully imported, please refresh')
              )
            ],
            updater => ors([
              result.data[0].harga && updater(
                'references', result.data.map(i =>
                  _.merge(i, {_id: randomId(), updated: _.now()})
                )
              ),
              result.data[0].full_name && updater(
                'patients', result.data.map(i => _.merge(
                  {updated: _.now(), _id: randomId()},
                  {identity: _.merge(
                    {
                      keluarga: {ayah: i.ayah || '', ibu: i.ibu || '', pasangan: i.pasangan || ''},
                      contact_num: i.contact_num || '', full_name: _.startCase(i.full_name),
                      tanggal_input: i.tanggal_input ? +moment(i.tanggal_input) : '',
                      date_of_birth: i.date_of_birth ? +moment(i.date_of_birth) : '',
                      place_of_birth: i.place_of_birth || '', home_address: i.home_address || '',
                      bayar_kartu: true
                    },
                    _.fromPairs(
                      ['religion', 'alias', 'blood', 'gender', 'civ_id',
                       'marital', 'mr_num', 'occupation', 'education']
                      .map(j => +i[j] ? [j, +i[j]] : ['', ''])
                    )
                  )}
                ))
              ),
              result.data[0].no_batch && updater(
                'goods', result.data.map(i => _.merge(
                  {_id: randomId(), updated: _.now()},
                  {
                    nama: i.nama_barang, jenis: +i.jenis, kandungan: i.kandungan,
                    satuan: +i.satuan, kriteria: {
                      antibiotik: +i.antibiotik, narkotika: +i.narkotika,
                      psikotropika: +i.psikotropika, fornas: +i.fornas
                    },
                    batches: [{
                      idbatch: randomId(), no_batch: i.no_batch, merek: i.merek,
                      masuk: i.masuk && +moment(i.masuk),
                      kadaluarsa: i.kadaluarsa && +moment(i.kadaluarsa),
                      stok: {gudang: +i.digudang, apotik: +i.diapotik, retur: +i.diretur},
                      harga: {beli: +i.beli, jual: +i.jual}, returnable: !!i.returnable,
                      sumber: {
                        supplier: i.supplier, anggaran: +i.anggaran, no_spk: i.no_spk,
                        tanggal_spk: i.tanggal_spk && +moment(i.tanggal_spk)
                      }
                    }]
                  }
                )).reduce((acc, inc) => withThis(
                  acc.find(j => j.nama === inc.nama),
                  found => found ? acc.map(j =>
                    j.nama === inc.nama ? _.assign(j, {
                      batches: [...j.batches, ...inc.batches]
                    }) : j
                  ) : [...acc, inc]
                ), [])
              )
            ])
          )
        })},
        m('label.file-label',
          m('input.file-input', {type: 'file', name: 'import'}),
          m('span.file-cta', m('span.file-label', 'Select File'))
        )
      ),
      m('a.help', {
        href: 'https://github.com/rikyperdana/simrs/wiki/Import-Master-Data',
        target: '_blank'
      }, 'Guide for file importing')
    ]
  ),

  management: () =>
    _.chunk(_.map(
      menus.management.children, (v, k) => [v, k]
    ), 3).map(i =>
      m('.columns', i.map(j => m('.column',
        m('.box', m('article.media',
          {onclick: () => [state.route = j[1], m.redraw()]},
          m('.media-left', m('span.icon.has-text-primary',
            m('i.fas.fa-2x.fa-'+j[0].icon))
          ),
          m('.media-content', m('.content',m('h3', j[0].full)))
        ))
      )))
    ),
})
