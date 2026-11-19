/** El stream pertenece a la app; el decodificador nunca administra la cámara. */
export function detenerStream(stream: Pick<MediaStream, "getTracks"> | null) {
  stream?.getTracks().forEach(track => track.stop());
}

export function capturaVigente(inicio: number, actual: number, lectorInicio: object, lectorActual: object | null) {
  return inicio === actual && lectorInicio === lectorActual;
}
