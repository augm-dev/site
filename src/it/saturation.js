import { compile } from 'augm-dev'
// import { stringifyObject } from 'obj-string'
import { idToMaxDepth, localize } from '../_utils'

export function saturationBuilder({ minify, npm, optimize }){
  return {
    single: (id) => ({
      [id+'/handlers.js']: ({ module, p, id }) => {
        let handlerExports = Object.keys(module).filter(e => e!=='default' && e!=='style')
        if(handlerExports.length > 0){
          return compile(`
            export { ${ handlerExports.join(',') } } from '@';
          `, {
            alias: p,
            minify,
            npm,
            optimize,
            local: localize('/index.js', id)
          })
        }
        return `export let handlers = null;`
      }
    }),
    aggregate: {
      'saturation.js': function(targets){
        let manifest = {}
        let imports_strings = []
        targets.forEach(({ module, id }) => {
          if(module.handlers && typeof module.handlers === 'object'){
            for(let handle in module.handlers){
              imports_strings.push(`"${handle}": () => import(".${id.slice(0,-3)}/handlers.js")`)
            }
          }
        });

        return compile(`
          import { saturateAsync } from 'augm-it/saturation';
          saturateAsync({
            ${imports_strings.join(',\n')}
          });
        `, {
          minify,
          optimize,
          local(id){
            return { path: id, external: true}
          }
        })
      }
    }
  }
}
