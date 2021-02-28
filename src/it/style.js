let csso = require('csso')

function minCSS(src){
  return csso.minify(src).css
}

function getModuleStyle(module, throwErrors = false){
  if(module){
    let { style } = module
    if(style){
      let t = typeof style
      if(t === 'function'){
        let output = style()
        if(output && typeof output.toString === 'function'){
          output = output.toString()
        }
        if(typeof output === 'string'){
          return output
        } else if(throwErrors) {
          this.error(`Style export must be a function that returns a string. Returned ${typeof output} instead.`)
        }
      } else if(throwErrors) {
        this.error(`Style export must be a function that returns a string`)
      }
    }
    return ""
  }
}

export function styleBuilder({ minify }){
  return {
    single: (id) => ({
      [`${id}/style.css`]: async function({ module }){
        let styles = getModuleStyle.call(this, module, true)
        return minify ? minCSS(styles) : styles
      }
    }),
    aggregate: {
      'styles.css': async function(targets){
        let styles = ""
        targets.forEach(({ module }) => {
          styles += getModuleStyle.call(this, module)
        })
        return minify ? minCSS(styles) : styles
      }
    }
  }
}