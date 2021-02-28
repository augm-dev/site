import { compile } from 'augm-dev'
import { idToMaxDepth, deeper } from '../_utils'

export function renderBuilder({ npm, minify, optimize }){

  function compileComponent(src){
    return function({ p, module, id }){
      if(module.default && typeof module.default === 'function'){
        return compile(src, {
          alias: p,
          minify,
          npm,
          optimize,
          local(dep){
            let new_path = dep.startsWith(idToMaxDepth(id)) ? dep + '/render.js' : dep
            return { path: deeper(new_path), external: true }
          }
        })
      }
    }
  }

  return {
    single: (id) => ({
      [id+'/render.js']: compileComponent(`
        export { default } from '@';
      `),
      // [id+'/node.js']: compileComponent(`
      //   import { html } from 'augm-it';
      //   import { default as it } from '@';
      //   export default ()=>html.node\`\${it.apply(null,arguments)}\`;
      // `)
    })
  }
}