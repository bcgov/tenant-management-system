export const convertIDPToDisplay = (idpType: string | undefined): string => {
  if (!idpType) {
    return ''
  }
  switch (idpType.toLowerCase()) {
    case 'idir':
      return 'IDIR'
    case 'bceidbasic':
      return 'BCeID'
    default:
      return idpType
  }
}