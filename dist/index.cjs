'use strict';

Object.defineProperty(exports, '__esModule', { value: true });

var augmDev = require('augm-dev');
require('obj-string');

function idToMaxDepth(id=""){
  let numSlashes = id.split('/').length - 1;
  if(numSlashes > 1 ){
    return '../'.repeat(numSlashes-1)
  }
  return './'
}

function deeper(p){
  if(p.startsWith('./')){
    return '.'+p
  } else if (p.startsWith('../')){
    return '../'+p
  }
  return p
}

function renderBuilder({ npm, minify, optimize }){

  function compileComponent(src){
    return function({ p, module, id }){
      if(module.default && typeof module.default === 'function'){
        return augmDev.compile(src, {
          alias: p,
          minify,
          npm,
          optimize,
          local(dep){
            let new_path = dep.startsWith(idToMaxDepth(id)) ? dep + '/render.js' : dep;
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

function saturationBuilder({ minify, npm, optimize }){
  return {
    single: (id) => ({
      [id+'/handlers.js']: ({ module, p, id }) => {
        let handlerExports = Object.keys(module).filter(e => e!=='default' && e!=='style');
        if(handlerExports.length > 0){
          return augmDev.compile(`
            export { ${ handlerExports.join(',') } } from '@';
          `, {
            alias: p,
            minify,
            npm,
            optimize,
            local(dep){
              let new_path = dep.startsWith(idToMaxDepth(id)) ? dep + '/handlers.js' : dep;
              return { path: deeper(new_path), external: true }
            }
          })
        }
        return `export let handlers = null;`
      }
    }),
    aggregate: {
      'saturation.js': function(targets){
        let imports_strings = [];
        targets.forEach(({ module, contents, id }) => {
          if(module.handlers && typeof module.handlers === 'object'){
            for(let handle in module.handlers){
              imports_strings.push(`"${handle}": () => import(".${id}/handlers.js")`);
            }
          }
        });

        return augmDev.compile(`
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

let csso = require('csso');

function minCSS(src){
  return csso.minify(src).css
}

function getModuleStyle(module, throwErrors = false){
  if(module){
    let { style } = module;
    if(style){
      let t = typeof style;
      if(t === 'function'){
        let output = style();
        if(output && typeof output.toString === 'function'){
          output = output.toString();
        }
        if(typeof output === 'string'){
          return output
        } else if(throwErrors) {
          this.error(`Style export must be a function that returns a string. Returned ${typeof output} instead.`);
        }
      } else if(throwErrors) {
        this.error(`Style export must be a function that returns a string`);
      }
    }
    return ""
  }
}

function styleBuilder({ minify }){
  return {
    single: (id) => ({
      [`${id}/style.css`]: async function({ module }){
        let styles = getModuleStyle.call(this, module, true);
        return minify ? minCSS(styles) : styles
      }
    }),
    aggregate: {
      'styles.css': async function(targets){
        let styles = "";
        targets.forEach(({ module }) => {
          styles += getModuleStyle.call(this, module);
        });
        return minify ? minCSS(styles) : styles
      }
    }
  }
}

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
};

let prefix = (str, obj) => {
  let out = {};
  for(let k in obj){
    out[str + k] = obj[k];
  }
  return out;
};

function itBuilder(options = {}){
  let { minify, npm, output, optimize } = { 
    ...defaultOptions, 
    ...options
  };

  let style = styleBuilder({ minify });
  let saturation = saturationBuilder({ minify, npm, optimize });
  let render = renderBuilder({ minify, npm, optimize });

  return {
    single: (id) => prefix(options.output, Object.assign(
      style.single(id),
      saturation.single(id),
      render.single(id)
    )),
    aggregate: prefix(options.output, Object.assign(
      style.aggregate,
      saturation.aggregate,
      render.aggregate
    ))
  }
}

function site(config){
  return {
    it: itBuilder(config)
  }
}
site.it = itBuilder;

exports.site = site;
