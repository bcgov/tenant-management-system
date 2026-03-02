export const convertIDPToDisplay = (idpType: string): string => {
  switch (idpType.toLowerCase()) {
    case 'idir':
      return 'IDIR'
    case 'bceidbasic':
      return 'BCeID'
    default:
      return idpType
  }
  return idpType
}