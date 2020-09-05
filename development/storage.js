/*global _ m comp db state look autoForm insertBoth schemas randomId hari rupiah lookUser ors makeModal updateBoth dbCall tds makeReport withThis moment afState ands deleteBoth makeIconLabel*/

_.assign(comp, {
  storage: () => !ors([
  _.includes([3, 4], state.login.bidang),
  _.includes([2, 3], state.login.peranan)
  ]) ? m('p', 'Only for pharmacist, storage users, nurses, and doctors')
  : m('.content',
    {onupdate: () =>
      db.goods.toArray(array => [
        state.goodsList = array, m.redraw()
      ])
    },
    m('h1', 'Goods Storage'),
    m('.field.has-addons',
      m('.control.is-expanded', m('input.input.is-fullwidth', {
        type: 'text', placeholder: 'Find goods...',
        onkeypress: e =>
          db.goods.filter(i => _.includes(
            _.lowerCase(i.nama+' '+i.kandungan), e.target.value
          )).toArray(array => [
            state.searchGoods = array, m.redraw()
          ])
      })),
      m('.control', m('a.button.is-info', {
        onclick: () => state.searchGoods = null
      }, 'Show All'))
    ),
    m('.box', m('table.table.is-striped',
      m('thead', m('tr',
        ['Type', 'Name', 'Unit', 'In Storage', 'In Pharmacy', 'In Quarantine']
        .map(i => m('th', i))
      )),
      m('tbody', (state.searchGoods || state.goodsList || [])
      .map(i => m('tr',
        {ondblclick: () => _.assign(state, {
          route: 'oneGood', oneGood: i
        })},
        tds([
          look('jenis_barang', +i.jenis),
          i.nama, look('satuan', i.satuan)
        ]),
        i.batch && ['gudang', 'apotik', 'retur']
        .map(j => withThis(
          _.sum(i.batch.map(k =>
            _.get(k.stok, j) || 0
          )),
          stokSum => m('td', {
            class: stokSum < i.stok_minimum[j] && 'has-text-danger'
          }, stokSum)
        ))
      )))
    )),
    state.login.bidang === 3 &&
    m('.button.is-primary',
      {onclick: () => _.assign(state, {
        route: 'formGood', oneGood: null
      })},
      makeIconLabel('plus', 'Add Good')
    )
  ),

  formGood: () => m('.content',
    m('h3', 'Input form for new good'),
    m(autoForm({
      id: 'formGood', schema: schemas.barang,
      confirmMessage: 'Are you sure to input this NEW good?',
      doc: state.oneGood,
      action: doc => withThis(
        _.assign(state.oneGood || {}, doc, {
          _id: _.get(state, 'oneGood._id') || randomId()
        }),
        obj => [
          state.oneGood ?
          updateBoth('goods', state.oneGood._id, obj)
          : insertBoth('goods', obj),
          _.assign(state, {route: 'oneGood', oneGood: obj})
        ]
      )
    }))
  ),

  oneGood: () =>  m('.content',
    {oncreate: () => [
      db.users.toArray(array => state.userList = array),
      dbCall({
        method: 'findOne', collection: 'goods',
        _id: state.oneGood._id
      }, res => res && db.goods.put(res))
    ]},
    m('h3', 'Good Details'),
    m('.box', m('table.table.is-striped', _.chunk([
      ['Good Name', state.oneGood.nama],
      ['Good Type', look('jenis_barang', state.oneGood.jenis)],
      ['Rack Num.', state.oneGood.kode_rak],
      ['Antibiotic', look('boolean', _.get(state.oneGood, 'kriteria.antibiotik'))],
      ['Narcotic', look('boolean', _.get(state.oneGood, 'kriteria.narkotika'))],
      ['Psychotropic', look('boolean', _.get(state.oneGood, 'kriteria.psikotropika'))],
      ['National Std.', look('boolean', _.get(state.oneGood, 'kriteria.fornas'))],
      ['Min. Storage', _.get(state, 'oneGood.stok_minimum.gudang')],
      ['Min. Pharmacy', _.get(state, 'oneGood.stok_minimum.apotik')],
      ['Composition', state.oneGood.kandungan],
      ['Unit', look('satuan', state.oneGood.satuan)]
    ], 3).map(i => m('tr', i.map(j =>
      [m('th', j[0]), m('td', j[1])]
    ))))),
    state.login.bidang === 3 && m('.buttons',
      m('.button.is-primary',
        {onclick: () => state.route = 'formBatch'},
        m('span.icon', m('i.fas.fa-plus-circle')),
        m('span', 'Add Batch')
      ),
      m('.button.is-warning',
        {onclick: () => state.route = 'formGood'},
        m('span.icon', m('i.fas.fa-edit')),
        m('span', 'Edit Good')
      ),
      state.login.peranan === 4 && [
        m('.button.is-danger',
          {
            "data-tooltip": 'Empty batches of this good',
            ondblclick: () => [
              confirm('Are you sure to stock opname this good?') &&
              updateBoth('goods', state.oneGood._id, _.assign(
                state.oneGood, {batch: []}
              )), state.route = 'storage', m.redraw()
            ]
          },
          m('span.icon', m('i.fas.fa-recycle')),
          m('span', 'Stock Opname')
        ),
        m('.button.is-danger',
          {
            "data-tooltip": 'To remove this good from DB potentially disrupt all transaction ever related to this good',
            ondblclick: () => [
              confirm('Are you sure to remove this good?') &&
              deleteBoth(
                'goods', state.oneGood._id,
                res => res && [state.route = 'storage', m.redraw()]
              )
            ]
          },
          m('span.icon', m('i.fas.fa-trash-alt')),
          m('span', 'Purge Good')
        )
      ]
    ),
    m('p'), m('h4', 'Batches list of this good'),
    m('.box', m('table.table.is-striped',
      m('thead', m('tr',
        ['Batch Num', 'Brand', 'Entry Date', 'Expired Date', 'In Storage', 'In Pharmacy', 'In Quarantine']
        .map(i => m('th', i))
      )),
      m('tbody', (state.oneGood.batch || []).map(i => m('tr',
        {class: +moment() > i.kadaluarsa && 'has-text-danger',
        ondblclick: () => _.assign(state, {
          oneBatch: i, modalBatch: m('.box',
            m('h4', 'Batch Detail'),
            m('table.table', _.chunk([
              ['Batch Num.', i.no_batch], ['Merek', i.merek],
              ['Entry Date', day(i.masuk)],
              ['Expired Date', day(i.kadaluarsa)],
              ['Purchase Price', currency(i.harga.beli)],
              ['Sale Price', currency(i.harga.jual)],
              ['Storage Stock', i.stok.gudang],
              ['Pharmacy Stock', _.get(i, 'stok.apotik')],
              ['Quarantine Amount', _.get(i, 'stok.retur')],
              ['Supplier Name', _.get(i, 'sumber.supplier')],
              ['Procurement Budget', _.get(i, 'sumber.anggaran')],
              ['Procurement ID', _.get(i, 'sumber.no_spk')],
              ['Procurement Date', day(_.get(i, 'sumber.tanggal_spk'))],
              ['Person in charge', lookUser(i.petugas)],
            ], 2).map(j => m('tr', j.map(k =>
              [m('th', k[0]), m('td', k[1])]
            )))),
            ands([
              state.login.peranan === 4,
              state.login.bidang === 3
            ]) && m('p.buttons',
              !_.get(i, 'stok.retur') && m('.button.is-warning',
                {
                  "data-tooltip": 'Transfer all stock to quarantine',
                  ondblclick: () => [
                    updateBoth('goods', state.oneGood._id, _.assign(
                      state.oneGood, {batch: state.oneGood.batch.map(j =>
                        j.idbatch === i.idbatch ?
                        _.assign(j, {stok: {gudang: 0, apotik: 0, retur:
                          (i.stok.gudang || 0) + (i.stok.apotik || 0)
                        }}) : j
                      )}
                    )), state.modalBatch = null, m.redraw()
                  ]
                },
                m('span.icon', m('i.fas.fa-exchange-alt')),
                m('span', 'Quarantine Batch')
              ),
              m('.button.is-danger',
                {ondblclick: e => [
                  updateBoth('goods', state.oneGood._id, _.assign(
                    state.oneGood, {batch: state.oneGood.batch.filter(j =>
                      j.idbatch !== i.idbatch
                    )}
                  )), state.modalBatch = null, m.redraw()
                ]},
                m('span.icon', m('i.fas.fa-trash')),
                m('span', 'Remove Batch')
              )
            ),
            m('br'),
            i.amprah && m('div',
              m('h4', 'Transfer History'),
              m('table.table',
                m('thead', m('tr',
                  ['Requester', 'Department', 'Amount Requested', 'Amount Given', 'Giver']
                  .map(j => m('th', j))
                )),
                m('tbody', i.amprah.map(j => m('tr', tds([
                  lookUser(j.peminta), look('bidang', j.ruangan), j.diminta,
                  j.diserah, lookUser(j.penyerah),
                ]))))
              ),
            ), m('br'),
            ands([
              ors([
                _.includes([4], state.login.bidang),
                _.includes([2, 3], state.login.peranan)
              ]),
              // tutup form amprah kalau di gudang 0
              i.stok.gudang > 1,
              [
                m('h4', 'Batch Transfer Form'),
                m(autoForm({
                  id: 'formAmprah', schema: schemas.amprah,
                  action: doc => [
                    updateBoth('goods', state.oneGood._id,
                      _.assign(state.oneGood, {batch:
                        state.oneGood.batch.map(j =>
                          j.idbatch === state.oneBatch.idbatch ?
                          _.assign(state.oneBatch, {
                            amprah: [...(state.oneBatch.amprah || []), doc]
                          }) : j
                        )
                      })
                    ), state.modalBatch = null, m.redraw()
                  ]
                }))
              ]
            ]),
          )})
        },
        tds([
          i.no_batch, i.merek, day(i.masuk), day(i.kadaluarsa),
          i.stok.gudang || 0, i.stok.apotik || 0, i.stok.retur || 0
        ])
      )))
    )),
    makeModal('modalBatch')
  ),

  formBatch: () => m('.content',
    m('h3', 'Add Batch Form'),
    m(autoForm({
      id: 'formBatch', schema: schemas.batch,
      confirmMessage: 'Are you sure to add a batch to this good?',
      action: doc => [
        updateBoth('goods', state.oneGood._id, _.assign(state.oneGood, {
          batch: [...(state.oneGood.batch || []), doc]
        })), state.route = 'oneGood'
      ]
    }))
  )
})
