/*global _ m comp db state look autoForm insertBoth schemas randomId hari rupiah lookUser ors makeModal updateBoth dbCall tds makeReport withThis moment afState ands deleteBoth makeIconLabel*/

_.assign(comp, {
  storage: () => !ors([
  _.includes([3, 4], state.login.bidang),
  _.includes([2, 3], state.login.peranan)
  ]) ? m('p', 'Hanya untuk user farmasi, apotik dan petugas medis')
  : m('.content',
    {onupdate: () =>
      db.goods.toArray(array => [
        state.goodsList = array, m.redraw()
      ])
    },
    m('h1', 'Gudang Farmasi'),
    m('.field.has-addons',
      m('.control.is-expanded', m('input.input.is-fullwidth', {
        type: 'text', placeholder: 'cari barang...',
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
        ['Jenis', 'Nama', 'Satuan', 'Gudang', 'Apotik', 'Retur']
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
      makeIconLabel('plus', 'Tambah barang')
    )
  ),

  formGood: () => m('.content',
    m('h3', 'Form input jenis barang baru'),
    m(autoForm({
      id: 'formGood', schema: schemas.barang,
      confirmMessage: 'Yakin untuk menyimpan JENIS barang baru?',
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
    m('h3', 'Rincian barang'),
    m('.box', m('table.table.is-striped', _.chunk([
      ['Nama barang', state.oneGood.nama],
      ['Jenis barang', look('jenis_barang', state.oneGood.jenis)],
      ['Kode Rak', state.oneGood.kode_rak],
      ['Antibiotik', look('boolean', _.get(state.oneGood, 'kriteria.antibiotik'))],
      ['Narkotika', look('boolean', _.get(state.oneGood, 'kriteria.narkotika'))],
      ['Psikotropika', look('boolean', _.get(state.oneGood, 'kriteria.psikotropika'))],
      ['Fornas', look('boolean', _.get(state.oneGood, 'kriteria.fornas'))],
      ['Min. Gudang', _.get(state, 'oneGood.stok_minimum.gudang')],
      ['Min. Apotik', _.get(state, 'oneGood.stok_minimum.apotik')],
      ['Kandungan', state.oneGood.kandungan],
      ['Satuan', look('satuan', state.oneGood.satuan)]
    ], 3).map(i => m('tr', i.map(j =>
      [m('th', j[0]), m('td', j[1])]
    ))))),
    state.login.bidang === 3 && m('.buttons',
      m('.button.is-primary',
        {onclick: () => state.route = 'formBatch'},
        m('span.icon', m('i.fas.fa-plus-circle')),
        m('span', 'Tambah batch')
      ),
      m('.button.is-warning',
        {onclick: () => state.route = 'formGood'},
        m('span.icon', m('i.fas.fa-edit')),
        m('span', 'Edit obat')
      ),
      state.login.peranan === 4 && [
        m('.button.is-danger',
          {
            "data-tooltip": 'Kosongkan semua batch barang ini',
            ondblclick: () => [
              confirm('Yakin untuk stok opname jenis barang ini?') &&
              updateBoth('goods', state.oneGood._id, _.assign(
                state.oneGood, {batch: []}
              )), state.route = 'storage', m.redraw()
            ]
          },
          m('span.icon', m('i.fas.fa-recycle')),
          m('span', 'Stok Opname')
        ),
        m('.button.is-danger',
          {
            "data-tooltip": 'Menghapus barang dapat merusak riwayat transaksi yang berhubungan dengan barang ini',
            ondblclick: () => [
              confirm('Yakin untuk menghapus jenis barang?') &&
              deleteBoth(
                'goods', state.oneGood._id,
                res => res && [state.route = 'storage', m.redraw()]
              )
            ]
          },
          m('span.icon', m('i.fas.fa-trash-alt')),
          m('span', 'Hapus barang')
        )
      ]
    ),
    m('p'), m('h4', 'Daftar batch barang ini'),
    m('.box', m('table.table.is-striped',
      m('thead', m('tr',
        ['No. Batch', 'Merek', 'Tanggal Masuk', 'Tanggal Kadaluarsa', 'Gudang', 'Apotik', 'Retur']
        .map(i => m('th', i))
      )),
      m('tbody', (state.oneGood.batch || []).map(i => m('tr',
        {class: +moment() > i.kadaluarsa && 'has-text-danger',
        ondblclick: () => _.assign(state, {
          oneBatch: i, modalBatch: m('.box',
            m('h4', 'Rincian batch'),
            m('table.table', _.chunk([
              ['No. Batch', i.no_batch], ['Merek', i.merek],
              ['Tanggal masuk', hari(i.masuk)],
              ['Tanggal kadaluarsa', hari(i.kadaluarsa)],
              ['Harga beli', rupiah(i.harga.beli)],
              ['Harga jual', rupiah(i.harga.jual)],
              ['Stok Gudang', i.stok.gudang],
              ['Stok Apotik', _.get(i, 'stok.apotik')],
              ['Jumlah Diretur', _.get(i, 'stok.retur')],
              ['Nama supplier', _.get(i, 'sumber.supplier')],
              ['Anggaran', _.get(i, 'sumber.anggaran')],
              ['No. SPK', _.get(i, 'sumber.no_spk')],
              ['Tanggal SPK', hari(_.get(i, 'sumber.tanggal_spk'))],
              ['Petugas', lookUser(i.petugas)],
            ], 2).map(j => m('tr', j.map(k =>
              [m('th', k[0]), m('td', k[1])]
            )))),
            ands([
              state.login.peranan === 4,
              state.login.bidang === 3
            ]) && m('p.buttons',
              !_.get(i, 'stok.retur') && m('.button.is-warning',
                {
                  "data-tooltip": 'Pindahkan semua stok barang ini ke Retur',
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
                m('span', 'Retur batch')
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
                m('span', 'Hapus batch')
              )
            ),
            m('br'),
            i.amprah && m('div',
              m('h4', 'Riwayat Amprah'),
              m('table.table',
                m('thead', m('tr',
                  ['Peminta', 'Asal', 'Diminta', 'Diserah', 'Penyerah']
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
                m('h4', 'Form amprah batch'),
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
          i.no_batch, i.merek, hari(i.masuk), hari(i.kadaluarsa),
          i.stok.gudang || 0, i.stok.apotik || 0, i.stok.retur || 0
        ])
      )))
    )),
    makeModal('modalBatch')
  ),

  formBatch: () => m('.content',
    m('h3', 'Form tambah batch'),
    m(autoForm({
      id: 'formBatch', schema: schemas.batch,
      confirmMessage: 'Yakin untuk menambahkan batch obat ini?',
      action: doc => [
        updateBoth('goods', state.oneGood._id, _.assign(state.oneGood, {
          batch: [...(state.oneGood.batch || []), doc]
        })), state.route = 'oneGood'
      ]
    }))
  )
})
