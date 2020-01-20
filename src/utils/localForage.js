import localForage from 'localforage' // 对indexedDB进行操作的开源库

export function setLocalForage (key, data, cb, cb2) {
  localForage.setItem(key, data).then((value) => {
    if (cb) cb(value)
  }).catch(function (err) {
    if (cb2) cb2(err)
  })
}

export function getLocalForage (key, cb) {
  localForage.getItem(key, (err, value) => {
    cb(err, value)
  })
}

export function removeLocalForage (key, cb, cb2) {
  localForage.removeItem(key).then(function () {
    cb()
  }).catch(function (err) {
    cb2(err)
  })
}

export function clearLocalForage (cb, cb2) {
  localForage.clear().then(function () {
    cb()
  }).catch(function (err) {
    cb2(err)
  })
}

// 遍历indexedDB中有多少个key
export function lengthLocalForage (cb) {
  localForage.length().then(
    numberOfKeys => {
      if (cb) cb(numberOfKeys)
      console.log(numberOfKeys)
    }).catch(function (err) {
    console.log(err)
  })
}

// 获取indexedDB中有多少个key，其中key，value是什么
export function iteratorLocalForage () {
  localForage.iterate(function (value, key, iterationNumber) {
    console.log([key, value])
  }).then(function () {
    console.log('Iteration has completed')
  }).catch(function (err) {
    console.log(err)
  })
}

// 判断是否支持 indexedDB
export function support () {
  const indexedDB = window.indexedDB || window.webkitIndexedDB || window.mozIndexedDB || null
  if (indexedDB) {
    return true
  } else {
    return false
  }
}
