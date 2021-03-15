import { compile } from 'augm-dev'
import { idToMaxDepth, localize } from '../_utils'

export function renderBuilder({ npm, minify, optimize }){

  function compileComponent(src){
    return function({ p, module, id }){
      if(module.default && typeof module.default === 'function'){
        return compile(src, {
          alias: p,
          minify,
          npm,
          optimize,
          local: localize('/render.js',id)
        })
      }
    }
  }

  return {
    single: (id) => ({
      [id+'/render.js']: compileComponent(`
        export { default } from '@';
      `),
      [id+'/index.js']: () => `export { default } from './render.js';
export * from './handlers.js';`,
      // [id+'/node.js']: compileComponent(`
      //   import { html } from 'augm-it';
      //   import { default as it } from '@';
      //   export default ()=>html.node\`\${it.apply(null,arguments)}\`;
      // `)
    })
  }
}