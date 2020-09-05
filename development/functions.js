/*global moment numeral _ m Dexie selects io*/

var
withThis = (obj, cb) => cb(obj),
ors = array => array.find(Boolean),
ands = array =>
  array.reduce((res, inc) => res && inc, true)
  && array[array.length-1],

randomId = () =>
  [1, 1].map(() =>
    Math.random().toString(36).slice(2)
  ).join(''),

day = (timestamp, hour) =>
  timestamp && moment(timestamp)
  .format('Do MMMM YYYY'+(hour ? ', hh:mm' : '')),

daysDifference = (start, end) =>
  Math.round((end - start) / (1000 * 60 * 60 * 24)),
  // miliseconds, seconds, minutes, hours

startOfTheDay = timestamp => +moment(
  moment(timestamp).format('YYYY-MM-DD')
),

tomorrow = timestamp => timestamp + 86400000,

currency = num =>
  '$ '+numeral(num || 0).format('0,0'),

dbCall = (body, action) =>
  io().emit('dbCall', body, action),

insertBoth = (collName, doc, cb) => withThis(
  _.merge(doc, {_id: randomId(), updated: _.now()}),
  obj => dbCall({
    method: 'insertOne', collection: collName, document: obj
  }, res => res && [
    cb && cb(res),
    db[collName].put(obj),
    io().emit('datachange', collName, doc)
  ])
),

updateBoth = (collName, _id, doc, cb) => withThis(
  _.merge(doc, {_id, updated: _.now()}),
  // pastikan di server terupdate dulu, baru client
  obj => dbCall({
    method: 'updateOne', collection: collName,
    document: obj, _id
  }, res => res && [
    cb && cb(res),
    db[collName].put(obj),
    io().emit('datachange', collName, doc)
  ])
),

deleteBoth = (collName, _id, cb) => dbCall({
  method: 'deleteOne', collection: collName, _id
}, res => res && [
  cb && cb(res),
  db[collName].delete(_id)
]),

wardFee = (enter, exit, fee) =>
  (daysDifference(enter - exit) || 1) * 1000 * +fee,

emergencyFee = 45000, tarifKartu = 8000,

collNames = ['patients', 'goods', 'references', 'users', 'queue'],

state = {route: 'dashboard'}, comp = {},

menus = {
  registration: {
    full: 'Registration', icon: 'address-book',
    children: {
      icd: {full: 'Codification', icon: 'code'},
      queue: {full: 'Queue', icon: 'stream'}
    }
  },
  emergency: {full: 'Emergency', icon: 'heartbeat'},
  outpatient: {full: 'Outpatient', icon: 'walking'},
  inpatient: {
    full: 'Inpatient', icon: 'bed',
    children: {
      beds: {full: 'Bed List', icon: 'bed'},
      surgery: {full: 'Surgery Queue', icon: 'procedures'},
      gizi: {full: 'Nutrition', icon: 'utensils'}
    }
  },
  cashier: {full: 'Cashier', icon: 'cash-register'},
  storage: {
    full: 'Storage', icon: 'cubes',
    children: {
      transfer: {full: 'Transfer', icon: 'exchange-alt'}
    }
  },
  pharmacy: {full: 'Pharmacy', icon: 'pills'},
  laboratory: {full: 'Laboratory', icon: 'flask'},
  radiology: {full: 'Radiology', icon: 'radiation'},
  management: {
    full: 'Management', icon: 'users',
    children: {
      users: {full: 'Users', icon: 'users'},
      references: {full: 'Reference', icon: 'file-contract'}
    }
  },
  gizi: {full: 'Nutrition', icon: 'utensils'},
  cssd: {full: 'CSSD', icon: 'tshirt'}
},

db = new Dexie('simrse'),

getDifference = name =>
  db[name].toArray(array =>
    dbCall({
      method: 'getDifference', collection: name,
      clientColl: array.map(i =>
        _.pick(i, ['_id', 'updated'])
      )
    }, res => res && [
      db[name].bulkPut(res),
      state.lastSync = +moment(),
      state.loading = false,
      m.redraw()
    ])
  ),

getDifferences = () =>
  collNames.map(name => getDifference(name))

db.version(1).stores(collNames.reduce((res, inc) =>
  _.merge(res, {[inc]: '_id'})
, {}))
