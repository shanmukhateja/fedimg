export interface WellknownResponseModel {
  subject: string
  aliases: string[]
  links: WellknownResponseLinkModel[]
}

export interface WellknownResponseLinkModel {
  rel: string
  type?: string
  href?: string
  template?: string
}
