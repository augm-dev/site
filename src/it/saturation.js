import { compile } from 'augm-dev'
import { stringifyObject } from 'obj-string'
import { idToMaxDepth, deeper } from '../_utils'

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
            local(dep){
              let new_path = dep.startsWith(idToMaxDepth(id)) ? dep + '/handlers.js' : dep
              return { path: deeper(new_path), external: true }
            }
          })
        }
        return `export let handlers = null;`
      }
    }),
    aggregate: {
      'saturation.js': function(targets){
        let manifest = {}
        let imports_strings = []
        targets.forEach(({ module, contents, id }) => {
          if(module.handlers && typeof module.handlers === 'object'){
            for(let handle in module.handlers){
              imports_strings.push(`"${handle}": () => import(".${id}/handlers.js")`)
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
