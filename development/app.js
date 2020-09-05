/*global _ comp m state menus look collNames db gapi dbCall withThis io autoForm schemas moment getDifferences betaMenus ors ands selects randomColor makeIconLabel*/

var topMenus = _.omit(menus, ['cssd', 'gizi'])
_.assign(comp, {
  navbar: () => m('nav.navbar.is-primary.is-fixed-top',
    m('.navbar-brand', m('a.navbar-item', {
      onclick: () => state.route = 'dashboard'
    }, "SIMRS.dev")),
    m('.navbar-menu',
      m('.navbar-start', _.map(topMenus, (val, key) =>
        m('a.navbar-item',
          {
            class: val.children && 'has-dropdown is-hoverable',
            onclick: () => state.route = key
          },
          val.children ? [
            m('a.navbar-link', _.startCase(val.full)),
            m('.navbar-dropdown', _.map(val.children, (i, j) =>
              m('a.navbar-item',
                {onclick: e => [e.stopPropagation(), state.route = j]},
                makeIconLabel(i.icon, i.full)
               )
            ))
          ] : m('span', _.startCase(val.full))
        )
      )),
      m('.navbar-end', m('.navbar-item.has-dropdown.is-hoverable',
        m('a.navbar-link', {
          onclick: () => [state.route = 'profile', m.redraw()]
        }, _.get(state.login, 'username')),
        m('.navbar-dropdown.is-right',
          m('a.navbar-item',
            makeIconLabel('user-tag', 'Role: '+ look('peranan', _.get(state.login, 'peranan')))
          ),
          m('a.navbar-item',
            makeIconLabel('shapes', 'Dept: '+look('bidang', _.get(state.login, 'bidang')))
          ),
          m('a.navbar-item',
            makeIconLabel('clinic-medical', 'Clinic: '+look('klinik', _.get(state.login, 'poliklinik')))
          ),
          m('hr.dropdown-divider'),
          m('a.navbar-item',
            {onclick: () => [
              _.assign(state, {login: null, route: 'login', loading: false}),
              localStorage.removeItem('login'),
              m.redraw()
            ]},
            makeIconLabel('sign-out-alt', 'Logout')
          )
        )
      ))
    ),
  ),

  dashboard: () => m('.content',
    m('h1', {oncreate: () => [
      getDifferences(),
      db.users.toArray(array =>
        state.userList = array
      )
    ]}, 'Dashboard'),
    m('.buttons',
      m('.button.is-info', {
        class: state.loading && 'is-loading',
        "data-tooltip": 'automatically updates by few minutes / manual',
        onclick: () => [state.loading = true, getDifferences()]
      }, 'Sync'),
      state.lastSync && m('span',
        'Last synchronization ' + moment(state.lastSync).fromNow()
      ),
    ),
    _.chunk(_.map(menus, (v, k) => [v, k]), 3).map(i =>
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
    m('h1', 'System Statistic'),
    m('.tabs.is-boxed', m('ul',
      {style: 'margin-left: 0%'},
      _.map({
        pasien: ['Patient', 'walking'],
        rawatJalan: ['Outpatient', 'ambulance'],
        emergency: ['Emergency', 'heart'],
        rawatInap: ['Inpatient', 'bed'],
        radiology: ['Radiology', 'radiation'],
        laboratory: ['Laboratory', 'flask'],
        management: ['Management', 'users']
      }, (val, key) => m('li',
        {class: key === state.dashboardTab && 'is-active'},
        m('a',
          {onclick: () => [state.dashboardTab = key, m.redraw()]},
          makeIconLabel(val[1], val[0])
        )
      ))
    )),
    m('.columns', {
      oncreate: () => [
        db.patients.toArray(array => _.merge(state, {stats: {
          pasien: {
            total: array.length,
            pria: array.filter(
              i => i.identitas.kelamin === 1
            ).length,
            wanita: array.filter(
              i => i.identitas.kelamin === 2
            ).length
          },
          rawatJalan: selects('klinik')().map(
            i => _.sum(array.map(
              j => (j.rawatJalan || []).filter(
                k => k.klinik === i.value
              ).length
            ).filter(Boolean))
          ),
          emergency: _.sum(array.map(i => (i.emergency || []).length)),
          rawatInap: _.sum(array.map(i => (i.rawatInap || []).length))
        }})),
        db.users.toArray(array => _.merge(state, {stats: {
          management: {
            petugas: array.filter(i => i.peranan === 1).length,
            perawat: array.filter(i => i.peranan === 2).length,
            dokter: array.filter(i => i.peranan === 3).length,
            admin: array.filter(i => i.peranan === 4).length
          }
        }}))
      ]
    }, ({
      pasien: [
        'Patient in total: '+_.get(state, 'stats.pasien.total'),
        'Total of male patient: '+_.get(state, 'stats.pasien.pria'),
        'Total of female patient: '+_.get(state, 'stats.pasien.wanita')
      ],
      rawatJalan: selects('klinik')().map(i => [
        'Total of outpatient service ', i.label, ': ',
        _.get(state, ['stats', 'rawatJalan', i.value-1])
      ].join('')),
      emergency: ['Total emergency service: '+_.get(state, 'stats.emergency')],
      rawatInap: ['Total inpatient service: '+_.get(state, 'stats.rawatInap') ],
      radiology: ['Total layanan radiologi: '],
      laboratory: ['Total laboratory service: '],
      management: [
        'Total of adm. users: '+_.get(state, 'stats.management.petugas'),
        'Total of nurses: '+_.get(state, 'stats.management.perawat'),
        'Total of doctors: '+_.get(state, 'stats.management.dokter')
      ]
    })[state.dashboardTab || 'pasien']
    .map(i => m('.column', m('.notification',
      {class: 'is-primary'}, i
    ))))
  ),

  login: () => m('.content', m('.columns',
    m('.column'),
    m('.column',
      !window.chrome && m('.notification.is-warning.is-light',
        'Please use the latest version of Chrome/Chromium'
      ),
      state.error && m('.notification.is-danger.is-light', [
        m('button.delete', {onclick: () => state.error = false}),
        state.error
      ]),
      _.range(3).map(() => m('br')),
      m('.level', m('.level-item.has-text-centered',
        m('span.icon.is-large.has-text-primary', m('i.fas.fa-8x.fa-stethoscope'))
      )), m('br'),
      m(autoForm({
        id: 'login', schema: schemas.login,
        submit: {
          value: 'Login',
          class: state.loading ? 'is-info is-loading' : 'is-info'
        },
        action: doc => [
          state.loading = true, m.redraw(),
          io().emit('login', doc, ({res}) => res ? [
            _.assign(state, {
              username: doc.username, route: 'dashboard', login: res
            }),
            localStorage.setItem('login', JSON.stringify(res)),
            m.redraw()
          ] : [
            state.loading = false,
            state.error = 'Wrong password',
            m.redraw()
          ])
        ]
      }))
     ),
    m('.column')
  ))
})

io().on('connect', socket => [
  state.login = localStorage.login &&
    JSON.parse(localStorage.login || '{}'),
  m.mount(document.body, {view: () => m('.has-background-light',
    comp.navbar(), m('.container',
      {style: 'min-height:100vh'}, m('br'),
      state.username || _.get(state, 'login.username') ?
      comp[state.route]() : comp.login()
    ),
    m('footer.footer',
      {style: 'padding:0px'},
      m('.content', m('a.help', {
        href: 'https://github.com/rikyperdana/simrs',
        target: '_blank'
      }, 'Versi 2.0.6'))
    )
  )}),
  // setiap kali data berubah, beritahu server untuk update seluruh klien yg sedang terkoneksi
  io().on('datachange', (name, doc) => [
    db[name].put(doc), state.lastSync = _.now()
  ]),
  // jika koneksi sempat terputus, langsung reload halaman
  io().on('disconnect', () => location.reload())
])
