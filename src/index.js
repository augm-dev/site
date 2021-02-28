import { itBuilder } from './it'

export function site(config){
  return {
    it: itBuilder(config)
  }
}
site.it = itBuilder
