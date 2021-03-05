import { renderBuilder } from './render'
import { saturationBuilder } from './saturation'
import { styleBuilder } from './style'

let defaultOptions = {
  minify: false,
  npm(id){
    return {
      path: `https://cdn.skypack.dev/${id}`,
      external: true
    }
  },
  async optimize(x){
    return x;
  },
  output: 'public/it/'
}

let prefix = (str, obj) => {
  let out = {}
  for(let k in obj){
    out[str + k] = obj[k]
  }
  return out;
}

export function itBuilder(options = {}){
  let { minify, npm, output, optimize } = { 
    ...defaultOptions,
    ...options
  }

  let style = styleBuilder({ minify })
  let saturation = saturationBuilder({ minify, npm, optimize })
  let render = renderBuilder({ minify, npm, optimize })

  return {
    single: (id) => prefix(options.output, Object.assign(
      style.single(id.slice(0,-3)),
      saturation.single(id.slice(0,-3)),
      render.single(id.slice(0,-3))
    )),
    aggregate: prefix(options.output, Object.assign(
      style.aggregate,
      saturation.aggregate,
      render.aggregate
    ))
  }
}