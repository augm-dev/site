
const path = require('path');

export function idToMaxDepth(id=""){
  let numSlashes = id.split('/').length - 1
  if(numSlashes > 1 ){
    return '../'.repeat(numSlashes-1)
  }
  return './'
}

export function deeper(p){
  if(p.startsWith('./')){
    return '.'+p
  } else if (p.startsWith('../')){
    return '../'+p
  }
  return p
}

export function localize(dest="/index.js", id=""){
  return function(dep){
    let combined = path.join('./',id,'/../',dep)
    let id_depth = id.split('/').filter(s => s.length > 0)
    if(dep.startsWith('../'.repeat(id_depth.length))){
      return { path: dep, external: false }
    } else {
      dep = dep.slice(0,-3) === '.js' ? dep.slice(0,-3) : dep
      return { path: deeper(dep+dest), external: true }
    }
  }
}