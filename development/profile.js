/*global m _ comp state look makeModal autoForm updateBoth io makeIconLabel*/

_.assign(comp, {
  profile: () => m('.content',
    m('h1', 'User Profile'),
    m('.box', m('table.table.is-striped', m('tbody',
      m('tr',
        m('th', 'Username'),
        m('td', state.login.username)
      ),
      m('tr',
        m('th', 'Password'),
        m('td', '*************'),
      ),
      m('tr',
        m('th', 'Full Name'),
        m('td', state.login.nama)
      ),
      m('tr',
        m('th', 'Department'),
        m('td', look('bidang', state.login.bidang))
      ),
      m('tr',
        m('th', 'Role'),
        m('td', look('peranan', state.login.peranan))
      )
    ))),
    m('.buttons',
      m('.button.is-warning',
        {onclick: () => state.modalProfile = m('.box',
          m(autoForm({
            id: 'formProfile',
            schema: {
              username: {
                type: String, optional: true,
                autoform: {
                  placeholder: 'Leave it empty if nothing is to be changed'
                }
              },
              password: {type: String, optional: true, autoform: {
                type: 'password',
                  placeholder: 'Leave it empty if nothing is to be changed'
              }},
              nama: {type: String, optional: true, label: 'Nama Lengkap', autoform: {
                placeholder: 'Leave it empty if nothing is to be changed'
              }}
            },
            action: doc => [
              doc.password ?
              io().emit('bcrypt', doc.password, res => updateBoth(
                'users', state.login._id, _.assign(state.login, doc, {password: res})
              )) : updateBoth('users', state.login._id, _.assign(state.login, doc)),
              state.modalProfile = null, m.redraw()
            ]
          }))
        )},
        makeIconLabel('edit', 'Update Account')
      ),
      m('a.button.is-info',
        {
          href: 'https://wa.me/628117696000?text=simrs.dev',
          target: '_blank'
        },
        makeIconLabel('envelope-open-text', 'Critic/Suggestion')
      ),
      m('a.button.is-link',
        {
          href: 'https://www.youtube.com/watch?v=irSxnKSRIOI&list=PL4oE8OvUySlyfGzQTu8kN9sPWWfcn_wSZ',
          target: '_blank'
        },
        makeIconLabel('chalkboard-teacher', 'Tutorials')
      ),
      m('a.button.is-danger',
        {onclick: () => [
          state.modalLicense = m('.box',
            m('h3', 'Unlock Enterprise License'),
            m('p.help', 'To remove all strike lines on all pdf output'),
            m(autoForm({
              id: 'updateLicense',
              schema: {key: {type: String, autoform: {
                placeholder: 'Get from Developer'
              }}},
              action: ({key}) => key.length === 15 && [
                withThis(['license', key.split(' ').reverse().join(''), localStorage],
                name => _.last(name).setItem(_.first(name), +(name[+true]+'e5'))),
                state.modalLicense = null,
                m.redraw()
              ]
            }))
          ),
          m.redraw()
        ]},
        makeIconLabel('key', 'Unlock')
      )
    ),
    makeModal('modalProfile'),
    makeModal('modalLicense')
  )
})
