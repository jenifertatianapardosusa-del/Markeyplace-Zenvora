import { useState } from 'react';
import { View, Text, TextInput, Pressable, ScrollView, StyleSheet, StatusBar, FlatList, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import {
  PRODUCTOS_INICIALES, CATEGORIAS, MARCA, C,
  MUNICIPIOS, MODALIDADES, TARIFAS, PLAZOS,
  PEDIDOS_INICIALES, DIRECCIONES_INICIALES, CONSULTAS_INICIALES,
} from './productos';
import { useFonts, Fredoka_700Bold } from '@expo-google-fonts/fredoka';

// ====================== CONSTANTES ======================
const ORDEN_ESTADOS = ['Confirmado', 'Preparando', 'En camino', 'Entregado'];
const RESPUESTA_DEMO = 'Respuesta automática de demostración: no fue escrita por una persona.';
const FILTROS_VACIOS = { marca: 'Todas', min: '', max: '', soloDisp: false };
const MOTIVOS = ['Entrega', 'Producto', 'Otro'];

// ====================== FUNCIONES DE CÁLCULO ======================
const formatoCOP = (n) => '$' + Math.round(n).toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.');
const ahora = () => new Date().toLocaleString('es-CO');

// el stock total es la suma del stock de las variantes
const stockTotal = (p) => p.variantes.reduce((suma, v) => suma + v.stock, 0);
const precioDesde = (p) => Math.min(...p.variantes.map((v) => v.precio));
const hayVariantes = (p) => p.variantes.length > 1;
const variantesDisp = (p) => p.variantes.filter((v) => v.stock > 0);
const precioDesdeDisp = (p) => Math.min(...variantesDisp(p).map((v) => v.precio));
const nombreModalidad = (id) => (MODALIDADES.find((m) => m.id === id) || {}).nombre || '';

// costo y plazo según municipio y modalidad (null si falta algún dato)
const infoEnvio = (municipio, modalidad) => {
  if (!TARIFAS[municipio] || !modalidad) return null;
  return { costo: TARIFAS[municipio][modalidad], plazo: PLAZOS[municipio][modalidad] };
};

// Busca el producto y la variante a partir de los id guardados en el carrito
const buscarVariante = (productos, productoId, varianteId) => {
  const p = productos.find((x) => x.id === productoId);
  const v = p ? p.variantes.find((x) => x.id === varianteId) : null;
  return { p, v };
};

// SUBTOTAL, DESCUENTO, ENVÍO Y TOTAL (envio = null mientras no haya dirección y modalidad)
const calcularResumen = (carrito, productos, cuponActivo, envio) => {
  const subtotal = carrito.reduce((acc, l) => {
    const { v } = buscarVariante(productos, l.id, l.varianteId);
    return acc + (v ? v.precio * l.cantidad : 0);
  }, 0);
  const descuento = cuponActivo ? Math.round(subtotal * 0.1) : 0;
  const envioFinal = subtotal === 0 ? 0 : envio === null ? 0 : envio;
  const total = Math.max(0, subtotal - descuento + envioFinal);
  return { subtotal, descuento, envio: envioFinal, envioPendiente: subtotal > 0 && envio === null, total };
};

// ====================== COMPONENTES REUTILIZABLES ======================
function Encabezado({ titulo, eslogan, icono, onVolver, children }) {
  return (
    <View style={s.encabezado}>
      <View style={s.circuloGrande} />
      <View style={s.circuloPequeno} />
      <View style={s.fila}>
        {onVolver && (
          <Pressable onPress={onVolver} style={[s.btnRedondo, { marginRight: 12 }]}>
            <Ionicons name="arrow-back" size={22} color={C.primario} />
          </Pressable>
        )}
        {icono && (
          <View style={s.iconoEnc}>
            <Ionicons name={icono} size={26} color={C.primario} />
          </View>
        )}
        <View style={{ flexShrink: 1 }}>
          <Text style={s.marca}>{titulo}</Text>
          {eslogan ? <Text style={s.eslogan}>{eslogan}</Text> : null}
        </View>
      </View>
      {children}
    </View>
  );
}

function Vacio({ icono, mensaje, detalle, textoBoton, onPress }) {
  return (
    <View style={s.vacio}>
      <View style={s.circuloVacio}>
        <Ionicons name={icono} size={56} color={C.primario} />
      </View>
      <Text style={s.vacioTitulo}>{mensaje}</Text>
      {detalle ? <Text style={s.vacioTxt}>{detalle}</Text> : null}
      {textoBoton ? (
        <Pressable style={[s.boton, { marginTop: 8 }]} onPress={onPress}>
          <Text style={s.botonTxt}>{textoBoton}</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

function Chip({ texto, activo, onPress }) {
  return (
    <Pressable onPress={onPress} style={[s.chip, { minHeight: 40, justifyContent: 'center', paddingHorizontal: 14 }, activo && s.chipOn]}>
      <Text style={[s.chipTxt, activo && { color: C.blanco }]}>{texto}</Text>
    </Pressable>
  );
}

function Foto({ p, style, inicialesStyle }) {
  if (p.imagen) return <Image source={p.imagen} style={style} resizeMode="cover" />;
  return <Text style={inicialesStyle}>{p.ini}</Text>;
}

function Tarjeta({ p, esFav, onFav, enComparacion, onComparar, onPress }) {
  return (
    <Pressable style={s.tarjeta} onPress={onPress}>
      <View style={s.recuadro}>
        <Foto p={p} style={s.fotoTarjeta} inicialesStyle={s.iniciales} />
        {stockTotal(p) === 0 && <Text style={s.agotado}>AGOTADO</Text>}
        <Pressable style={s.corazon} onPress={onFav}>
          <Ionicons name={esFav ? 'heart' : 'heart-outline'} size={20} color={C.primario} />
        </Pressable>
        <Pressable style={[s.corazon, { top: 46 }, enComparacion && { backgroundColor: C.primario }]} onPress={onComparar}>
          <Ionicons name="git-compare-outline" size={18} color={enComparacion ? C.blanco : C.primario} />
        </Pressable>
      </View>
      <View style={{ padding: 10 }}>
        <Text style={s.tarjetaNombre}>{p.nombre}</Text>
        <Text style={s.gris}>{p.categoria}</Text>
        <Text style={s.gris}>{stockTotal(p) === 0 ? 'Agotado' : 'Disponible: ' + stockTotal(p)}</Text>
        <Text style={s.precio}>{(hayVariantes(p) ? 'Desde ' : '') + formatoCOP(precioDesde(p))}</Text>
      </View>
    </Pressable>
  );
}

// ====================== PANTALLAS ======================

// ---------- CATÁLOGO (búsqueda + categoría + filtros combinados) ----------
function Catalogo({
  productos, favoritos, toggleFavorito, abrirDetalle, busqueda, setBusqueda, categoria, setCategoria,
  orden, setOrden, filtros, setFiltros, comparacion, toggleComparar, irComparador,
}) {
  const [panel, setPanel] = useState(false);
  const [borrador, setBorrador] = useState(filtros);
  const [errorFiltro, setErrorFiltro] = useState('');
  const marcas = ['Todas', ...Array.from(new Set(productos.map((p) => p.marca)))];
  const nFiltros = [filtros.marca !== 'Todas', filtros.min !== '', filtros.max !== '', filtros.soloDisp].filter(Boolean).length;

  const aplicar = () => {
    const min = borrador.min.trim();
    const max = borrador.max.trim();
    if ((min !== '' && !/^\d+$/.test(min)) || (max !== '' && !/^\d+$/.test(max)))
      return setErrorFiltro('El precio debe ser un número entero');
    if (min !== '' && max !== '' && Number(min) > Number(max))
      return setErrorFiltro('El precio mínimo no puede ser mayor que el máximo');
    setErrorFiltro('');
    setFiltros({ ...borrador, min, max });
  };

  const restablecer = () => {
    setBorrador(FILTROS_VACIOS);
    setFiltros(FILTROS_VACIOS);
    setBusqueda('');
    setCategoria('Todas');
    setErrorFiltro('');
  };

  const minN = filtros.min === '' ? 0 : Number(filtros.min);
  const maxN = filtros.max === '' ? Infinity : Number(filtros.max);
  let lista = productos.filter(
    (p) =>
      p.nombre.toLowerCase().includes(busqueda.trim().toLowerCase()) &&
      (categoria === 'Todas' || p.categoria === categoria) &&
      (filtros.marca === 'Todas' || p.marca === filtros.marca) &&
      p.variantes.some((v) => v.precio >= minN && v.precio <= maxN) &&
      (!filtros.soloDisp || stockTotal(p) > 0)
  );
  lista = [...lista].sort((a, b) => (orden === 'asc' ? precioDesde(a) - precioDesde(b) : precioDesde(b) - precioDesde(a)));

  const panelFiltros = panel ? (
    <View style={s.panelFiltros}>
      <Text style={[s.gris, { marginBottom: 6 }]}>Marca</Text>
      <View style={s.wrap}>
        {marcas.map((m) => (
          <Chip key={m} texto={m} activo={borrador.marca === m} onPress={() => setBorrador({ ...borrador, marca: m })} />
        ))}
      </View>
      <Text style={[s.gris, { marginTop: 12, marginBottom: 6 }]}>Rango de precio (COP)</Text>
      <View style={s.fila}>
        <TextInput style={[s.inputCupon, { marginRight: 8 }]} placeholder="Mínimo" keyboardType="numeric" value={borrador.min} onChangeText={(v) => setBorrador({ ...borrador, min: v })} />
        <TextInput style={[s.inputCupon, { marginRight: 0 }]} placeholder="Máximo" keyboardType="numeric" value={borrador.max} onChangeText={(v) => setBorrador({ ...borrador, max: v })} />
      </View>
      <View style={[s.wrap, { marginTop: 12 }]}>
        <Chip texto="Solo disponibles" activo={borrador.soloDisp} onPress={() => setBorrador({ ...borrador, soloDisp: !borrador.soloDisp })} />
      </View>
      {errorFiltro !== '' && <Text style={[s.error, { marginTop: 8 }]}>{errorFiltro}</Text>}
      <View style={[s.fila, { marginTop: 12 }]}>
        <Pressable style={[s.botonCupon, { flex: 1, marginRight: 8 }]} onPress={aplicar}><Text style={s.botonTxt}>Aplicar</Text></Pressable>
        <Pressable style={[s.botonBorde, { flex: 1, marginTop: 0, height: 44 }]} onPress={restablecer}><Text style={s.botonBordeTxt}>Restablecer</Text></Pressable>
      </View>
    </View>
  ) : null;

  return (
    <View style={{ flex: 1 }}>
      <Encabezado titulo={MARCA.nombre} eslogan={MARCA.eslogan}>
        <View style={s.buscador}>
          <Ionicons name="search" size={20} color={C.primario} />
          <TextInput style={s.inputBuscar} placeholder="Buscar en Zenvora" value={busqueda} onChangeText={setBusqueda} />
        </View>
      </Encabezado>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ flexGrow: 0, flexShrink: 0 }} contentContainerStyle={s.chips}>
        {CATEGORIAS.map((c) => (
          <Pressable key={c} onPress={() => setCategoria(c)} style={[s.chip, c === categoria && s.chipOn]}>
            <Text style={[s.chipTxt, c === categoria && { color: C.blanco }]}>{c}</Text>
          </Pressable>
        ))}
      </ScrollView>

      <View style={[s.fila, { justifyContent: 'space-between', paddingHorizontal: 20, marginBottom: 8 }]}>
        <Text style={s.gris}>{lista.length} productos</Text>
        <View style={s.fila}>
          {comparacion.length > 0 && (
            <Pressable style={[s.chip, { marginRight: 8 }]} onPress={irComparador}>
              <Text style={s.chipTxt}>Comparar ({comparacion.length})</Text>
            </Pressable>
          )}
          <Pressable style={[s.chip, { marginRight: 8 }]} onPress={() => setPanel(!panel)}>
            <Text style={s.chipTxt}>Filtros{nFiltros > 0 ? ' (' + nFiltros + ')' : ''}</Text>
          </Pressable>
          <Pressable style={s.chip} onPress={() => setOrden(orden === 'asc' ? 'desc' : 'asc')}>
            <Text style={s.chipTxt}>{orden === 'asc' ? 'Menor a mayor' : 'Mayor a menor'}</Text>
          </Pressable>
        </View>
      </View>

      <FlatList
        data={lista}
        numColumns={2}
        keyExtractor={(p) => p.id}
        ListHeaderComponent={panelFiltros}
        columnWrapperStyle={{ justifyContent: 'space-between', paddingHorizontal: 16 }}
        ListEmptyComponent={
          <Vacio icono="search-outline" mensaje="No encontramos productos"
            detalle="Ningún producto cumple la búsqueda y los filtros actuales. Amplía el rango de precio o restablece los filtros."
            textoBoton="Restablecer" onPress={restablecer} />
        }
        renderItem={({ item }) => (
          <Tarjeta p={item} esFav={favoritos.includes(item.id)} onFav={() => toggleFavorito(item.id)}
            enComparacion={comparacion.includes(item.id)} onComparar={() => toggleComparar(item.id)}
            onPress={() => abrirDetalle(item)} />
        )}
      />
    </View>
  );
}

// ---------- DETALLE (variantes, reposición, preguntas, relacionados) ----------
function Detalle({
  producto, productos, esFav, toggleFavorito, agregar, volver, valoraciones, valorar,
  consultas, preguntar, simularRespuesta, suscripciones, suscribir, cancelarSuscripcion, simularReposicion, abrirDetalle,
}) {
  // Si el producto tiene una sola variante, queda elegida automáticamente
  const [varianteId, setVarianteId] = useState(hayVariantes(producto) ? null : producto.variantes[0].id);
  const [pregunta, setPregunta] = useState('');
  const [errorPreg, setErrorPreg] = useState('');
  const variante = producto.variantes.find((v) => v.id === varianteId) || null;
  const agotado = stockTotal(producto) === 0;
  const sinStockVariante = variante !== null && variante.stock === 0;
  const bloqueado = agotado || sinStockVariante;
  const lista = valoraciones[producto.id] || [];
  const promedio = lista.length ? lista.reduce((a, b) => a + b, 0) / lista.length : 0;
  const precioMostrado = variante ? variante.precio : precioDesde(producto);
  const suscrito = variante ? suscripciones.some((x) => x.varianteId === variante.id) : false;
  const preguntas = consultas.filter((c) => c.productoId === producto.id);
  // relacionados: misma categoría, distinto producto y con stock (máximo 4)
  const relacionados = productos.filter((p) => p.id !== producto.id && p.categoria === producto.categoria && stockTotal(p) > 0).slice(0, 4);

  const enviarPregunta = () => {
    const t = pregunta.trim();
    if (t.length < 10) return setErrorPreg('La pregunta debe tener al menos 10 caracteres');
    setErrorPreg('');
    preguntar(producto.id, t);
    setPregunta('');
  };

  return (
    <View style={{ flex: 1 }}>
      <View style={s.heroDetalle}>
        <Foto p={producto} style={s.fotoHero} inicialesStyle={s.inicialesGrandes} />
        <Pressable style={[s.btnRedondo, { position: 'absolute', left: 20, top: 48 }]} onPress={volver}>
          <Ionicons name="arrow-back" size={22} color={C.primario} />
        </Pressable>
        <Pressable style={[s.btnRedondo, { position: 'absolute', right: 20, top: 48 }]} onPress={() => toggleFavorito(producto.id)}>
          <Ionicons name={esFav ? 'heart' : 'heart-outline'} size={22} color={C.primario} />
        </Pressable>
      </View>

      <ScrollView contentContainerStyle={{ padding: 20 }}>
        <View style={s.etiqueta}><Text style={{ color: C.blanco }}>{producto.categoria}</Text></View>
        <Text style={s.tituloDetalle}>{producto.nombre}</Text>
        <Text style={s.gris}>Marca: {producto.marca}</Text>

        <View style={[s.fila, { marginTop: 8 }]}>
          {[1, 2, 3, 4, 5].map((n) => (
            <Pressable key={n} onPress={() => valorar(producto.id, n)}>
              <Ionicons name={n <= Math.round(promedio) ? 'star' : 'star-outline'} size={24} color={C.primario} />
            </Pressable>
          ))}
          <Text style={[s.gris, { marginLeft: 8 }]}>
            {lista.length ? promedio.toFixed(1).replace('.', ',') + ' (' + lista.length + ')' : 'Toca una estrella para calificar'}
          </Text>
        </View>

        {hayVariantes(producto) && (
          <View style={{ marginTop: 14 }}>
            <Text style={[s.gris, { marginBottom: 6 }]}>Elige una variante</Text>
            <View style={s.wrap}>
              {producto.variantes.map((v) => (
                <Pressable
                  key={v.id}
                  onPress={() => setVarianteId(v.id)}
                  style={[s.chip, { minHeight: 44, justifyContent: 'center', paddingHorizontal: 16 }, v.id === varianteId && s.chipOn, v.stock === 0 && { opacity: 0.5 }]}
                >
                  <Text style={[s.chipTxt, v.id === varianteId && { color: C.blanco }]}>{v.etiqueta}</Text>
                </Pressable>
              ))}
            </View>
          </View>
        )}

        <View style={[s.fila, { justifyContent: 'space-between', marginVertical: 14 }]}>
          <Text style={s.precioGrande}>{(!variante && hayVariantes(producto) ? 'Desde ' : '') + formatoCOP(precioMostrado)}</Text>
          <View style={s.chip}>
            <Text style={s.chipTxt}>
              {variante
                ? variante.stock === 0 ? 'Variante agotada' : 'Disponible - ' + variante.stock + ' unidades'
                : agotado ? 'Agotado' : 'Total: ' + stockTotal(producto) + ' unidades'}
            </Text>
          </View>
        </View>
        <Text style={s.gris}>{producto.descripcion}</Text>

        {/* HU30: aviso de reposición */}
        {sinStockVariante && (
          <View style={s.caja}>
            <Text style={s.tarjetaNombre}>Sin existencias</Text>
            {suscrito ? (
              <Pressable style={s.botonBorde} onPress={() => cancelarSuscripcion(variante.id)}>
                <Text style={s.botonBordeTxt}>Cancelar aviso de reposición</Text>
              </Pressable>
            ) : (
              <Pressable style={[s.boton, { marginTop: 10 }]} onPress={() => suscribir(producto.id, variante.id)}>
                <Text style={s.botonTxt}>Avisarme cuando haya stock</Text>
              </Pressable>
            )}
            <Pressable style={{ marginTop: 10 }} onPress={() => simularReposicion(producto.id, variante.id)}>
              <Text style={s.link}>Simular reposición (solo demostración)</Text>
            </Pressable>
          </View>
        )}

        {/* HU24: preguntas */}
        <Text style={[s.subtitulo, { marginTop: 22 }]}>Preguntas</Text>
        {preguntas.length === 0 && <Text style={s.gris}>Aún no hay preguntas para este producto.</Text>}
        {preguntas.map((c) => (
          <View key={c.id} style={s.caja}>
            <Text style={s.tarjetaNombre}>{c.pregunta}</Text>
            <Text style={s.gris}>{c.fecha} - {c.estado}</Text>
            {c.respuesta ? (
              <Text style={s.respuesta}>{c.respuesta}</Text>
            ) : (
              <Pressable style={{ marginTop: 8 }} onPress={() => simularRespuesta(c.id)}>
                <Text style={s.link}>Simular respuesta (solo demostración)</Text>
              </Pressable>
            )}
          </View>
        ))}
        <TextInput
          style={[s.input, { height: 70, paddingTop: 12, textAlignVertical: 'top', marginTop: 10 }, errorPreg !== '' && { borderColor: '#B00020' }]}
          placeholder="Escribe tu pregunta (mínimo 10 caracteres)"
          multiline
          value={pregunta}
          onChangeText={setPregunta}
        />
        {errorPreg !== '' && <Text style={[s.error, { marginBottom: 8 }]}>{errorPreg}</Text>}
        <Pressable style={s.botonBorde} onPress={enviarPregunta}>
          <Text style={s.botonBordeTxt}>Enviar pregunta</Text>
        </Pressable>

        {/* HU31: relacionados */}
        <Text style={[s.subtitulo, { marginTop: 22 }]}>Productos relacionados</Text>
        {relacionados.length === 0 ? (
          <Text style={s.gris}>No hay otros productos disponibles en esta categoría por ahora.</Text>
        ) : (
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {relacionados.map((r) => (
              <Pressable key={r.id} style={s.tarjetaRel} onPress={() => abrirDetalle(r)}>
                <View style={s.recuadroRel}><Foto p={r} style={s.fotoTarjeta} inicialesStyle={s.iniciales} /></View>
                <View style={{ padding: 8 }}>
                  <Text style={s.tarjetaNombre} numberOfLines={1}>{r.nombre}</Text>
                  <Text style={s.gris}>Disponible: {stockTotal(r)}</Text>
                  <Text style={s.precio}>{(variantesDisp(r).length > 1 ? 'Desde ' : '') + formatoCOP(precioDesdeDisp(r))}</Text>
                </View>
              </Pressable>
            ))}
          </ScrollView>
        )}
      </ScrollView>

      <View style={{ padding: 20 }}>
        <Pressable disabled={bloqueado} style={[s.boton, bloqueado && { backgroundColor: '#BBBBBB' }]} onPress={() => agregar(producto.id, varianteId)}>
          <Text style={s.botonTxt}>{agotado ? 'Agotado' : sinStockVariante ? 'Variante agotada' : 'Agregar al carrito'}</Text>
        </Pressable>
      </View>
    </View>
  );
}

// ---------- FAVORITOS ----------
function Favoritos({ productos, favoritos, toggleFavorito, comparacion, toggleComparar, abrirDetalle, irCatalogo }) {
  const lista = productos.filter((p) => favoritos.includes(p.id));
  return (
    <View style={{ flex: 1 }}>
      <Encabezado titulo="Favoritos" eslogan="Lo que más te gusta" icono="heart" />
      {lista.length === 0 ? (
        <Vacio icono="heart-outline" mensaje="Aún no tienes favoritos"
          detalle="Toca el corazón en un producto para guardarlo aquí."
          textoBoton="Ir al catálogo" onPress={irCatalogo} />
      ) : (
        <FlatList
          data={lista}
          numColumns={2}
          keyExtractor={(p) => p.id}
          style={{ marginTop: 12 }}
          columnWrapperStyle={{ justifyContent: 'space-between', paddingHorizontal: 16 }}
          renderItem={({ item }) => (
            <Tarjeta p={item} esFav onFav={() => toggleFavorito(item.id)}
              enComparacion={comparacion.includes(item.id)} onComparar={() => toggleComparar(item.id)}
              onPress={() => abrirDetalle(item)} />
          )}
        />
      )}
    </View>
  );
}

// ---------- FILAS DEL RESUMEN ----------
function Resumen({ resumen, hayProductos }) {
  const Fila = ({ a, b, fuerte }) => (
    <View style={[s.fila, { justifyContent: 'space-between', marginVertical: 3 }]}>
      <Text style={[s.resumenTxt, fuerte && s.resumenTotal]}>{a}</Text>
      <Text style={[s.resumenTxt, fuerte && s.resumenTotal]}>{b}</Text>
    </View>
  );
  return (
    <View style={s.cajaResumen}>
      <Fila a="Subtotal" b={formatoCOP(resumen.subtotal)} />
      {resumen.descuento > 0 && <Fila a="Descuento 10 %" b={'-' + formatoCOP(resumen.descuento)} />}
      <Fila a="Envío" b={!hayProductos ? '$0' : resumen.envioPendiente ? 'Se calcula en el pago' : formatoCOP(resumen.envio)} />
      <View style={{ height: 1, backgroundColor: C.primario, marginVertical: 6 }} />
      <Fila a="Total" b={formatoCOP(resumen.total)} fuerte />
    </View>
  );
}

// ---------- CARRITO ----------
function Carrito({ carrito, productos, resumen, agregar, disminuir, eliminar, cuponActivo, aplicarCupon, irCheckout, irCatalogo }) {
  const [codigo, setCodigo] = useState('');
  return (
    <View style={{ flex: 1 }}>
      <Encabezado titulo="Mi carrito" eslogan="Revisa tu pedido antes de comprar" icono="cart" />
      {carrito.length === 0 ? (
        <>
          <Vacio icono="cart-outline" mensaje="Tu carrito está vacío"
            detalle="Agrega productos para armar tu pedido."
            textoBoton="Ir al catálogo" onPress={irCatalogo} />
          <View style={{ padding: 20 }}>
            <Resumen resumen={resumen} hayProductos={false} />
          </View>
        </>
      ) : (
        <>
          <ScrollView contentContainerStyle={{ padding: 20 }}>
            {carrito.map((l) => {
              const { p, v } = buscarVariante(productos, l.id, l.varianteId);
              return (
                <View key={l.id + '|' + l.varianteId} style={s.lineaCarrito}>
                  <View style={s.miniRecuadro}><Foto p={p} style={s.fotoMini} inicialesStyle={s.miniIniciales} /></View>
                  <View style={{ flex: 1, marginLeft: 12 }}>
                    <Text style={s.tarjetaNombre}>{p.nombre}</Text>
                    {hayVariantes(p) && <Text style={s.gris}>{v.etiqueta}</Text>}
                    <Text style={s.precio}>{formatoCOP(v.precio)}</Text>
                    <View style={s.fila}>
                      <Pressable style={[s.btnCant, { backgroundColor: C.suave }]} onPress={() => disminuir(l.id, l.varianteId)}>
                        <Text style={[s.btnCantTxt, { color: C.primario }]}>-</Text>
                      </Pressable>
                      <Text style={s.cantidad}>{l.cantidad}</Text>
                      <Pressable style={[s.btnCant, { backgroundColor: C.primario }]} onPress={() => agregar(l.id, l.varianteId)}>
                        <Text style={[s.btnCantTxt, { color: C.blanco }]}>+</Text>
                      </Pressable>
                    </View>
                  </View>
                  <Pressable style={s.btnRedondo} onPress={() => eliminar(l.id, l.varianteId)}>
                    <Ionicons name="trash-outline" size={22} color={C.primario} />
                  </Pressable>
                </View>
              );
            })}

            <View style={[s.fila, { marginVertical: 8 }]}>
              <TextInput style={s.inputCupon} placeholder="Cupón de descuento" autoCapitalize="characters" value={codigo} onChangeText={setCodigo} />
              <Pressable style={s.botonCupon} onPress={() => aplicarCupon(codigo)}>
                <Text style={s.botonTxt}>Aplicar</Text>
              </Pressable>
            </View>
            {cuponActivo && <Text style={[s.gris, { marginBottom: 6 }]}>Cupón BIENVENIDO10 aplicado</Text>}

            <Resumen resumen={resumen} hayProductos />
          </ScrollView>

          <View style={{ padding: 20 }}>
            <Text style={s.aviso2}>Simulación: no se realiza ningún cobro</Text>
            <Pressable style={s.boton} onPress={irCheckout}>
              <Text style={s.botonTxt}>Continuar con el pago</Text>
            </Pressable>
          </View>
        </>
      )}
    </View>
  );
}

// ---------- CHECKOUT: datos, dirección, modalidad y revisión ----------
function Checkout({
  carrito, productos, resumen, confirmar, volver, direcciones, direccionSel, setDireccionSel,
  modalidad, setModalidad, comprador, setComprador, irDirecciones,
}) {
  const [paso, setPaso] = useState('datos'); // 'datos' -> 'revision'
  const [error, setError] = useState('');
  const dir = direcciones.find((d) => d.id === direccionSel) || null;
  const envio = dir ? infoEnvio(dir.municipio, modalidad) : null;

  const continuar = () => {
    const faltan = [];
    if (comprador.nombre.trim() === '') faltan.push('nombre');
    if (comprador.telefono.trim() === '') faltan.push('teléfono');
    if (!dir) faltan.push('dirección de entrega');
    if (!modalidad) faltan.push('modalidad de envío');
    if (faltan.length > 0) return setError('Falta completar: ' + faltan.join(', '));
    if (!/^\d{7,10}$/.test(comprador.telefono.trim())) return setError('El teléfono debe tener entre 7 y 10 números');
    setError('');
    setPaso('revision');
  };

  return (
    <View style={{ flex: 1 }}>
      <Encabezado titulo={paso === 'datos' ? 'Tus datos' : 'Revisa tu pedido'} onVolver={paso === 'datos' ? volver : () => setPaso('datos')} />
      <ScrollView contentContainerStyle={{ padding: 20 }}>
        {paso === 'datos' ? (
          <>
            <TextInput style={s.input} placeholder="Nombre completo" value={comprador.nombre} onChangeText={(v) => setComprador({ ...comprador, nombre: v })} />
            <TextInput style={s.input} placeholder="Teléfono" keyboardType="numeric" value={comprador.telefono} onChangeText={(v) => setComprador({ ...comprador, telefono: v })} />

            <Text style={s.subtitulo}>Dirección de entrega</Text>
            {direcciones.length === 0 && <Text style={[s.gris, { marginBottom: 8 }]}>Aún no tienes direcciones registradas.</Text>}
            {direcciones.map((d) => (
              <Pressable key={d.id} style={[s.caja, d.id === direccionSel && { borderColor: C.primario, borderWidth: 2 }]} onPress={() => setDireccionSel(d.id)}>
                <Text style={s.tarjetaNombre}>{d.alias}{d.principal ? '  (Principal)' : ''}</Text>
                <Text style={s.gris}>{d.municipio} - {d.referencia}</Text>
              </Pressable>
            ))}
            <Pressable style={[s.botonBorde, { marginBottom: 14 }]} onPress={irDirecciones}>
              <Text style={s.botonBordeTxt}>Administrar mis direcciones</Text>
            </Pressable>

            <Text style={s.subtitulo}>Modalidad de envío</Text>
            <View style={[s.wrap, { marginTop: 6 }]}>
              {MODALIDADES.map((m) => (
                <Chip key={m.id} texto={m.nombre} activo={modalidad === m.id} onPress={() => setModalidad(m.id)} />
              ))}
            </View>
            {envio && (
              <Text style={[s.gris, { marginTop: 8 }]}>
                Envío a {dir.municipio} ({nombreModalidad(modalidad)}): {formatoCOP(envio.costo)} - llega en {envio.plazo}
              </Text>
            )}
            <View style={{ height: 12 }} />
            <Resumen resumen={resumen} hayProductos />
            {error !== '' && <Text style={[s.error, { marginTop: 10 }]}>{error}</Text>}
          </>
        ) : (
          <>
            <Text style={s.subtitulo}>Entrega</Text>
            <Text style={s.gris}>{comprador.nombre} - {comprador.telefono}</Text>
            <Text style={s.gris}>{dir.alias}: {dir.referencia}, {dir.municipio}</Text>
            <Text style={[s.gris, { marginBottom: 12 }]}>Envío {nombreModalidad(modalidad)} - {envio.plazo}</Text>
            <Text style={s.subtitulo}>Productos</Text>
            {carrito.map((l) => {
              const { p, v } = buscarVariante(productos, l.id, l.varianteId);
              return (
                <Text key={l.id + '|' + l.varianteId} style={s.gris}>
                  {l.cantidad} x {p.nombre}{v.etiqueta !== 'Única' ? ' (' + v.etiqueta + ')' : ''} - {formatoCOP(v.precio * l.cantidad)}
                </Text>
              );
            })}
            <View style={{ height: 12 }} />
            <Resumen resumen={resumen} hayProductos />
          </>
        )}
      </ScrollView>
      <View style={{ padding: 20 }}>
        <Text style={s.aviso2}>Simulación: no se realiza ningún cobro</Text>
        {paso === 'datos' ? (
          <Pressable style={s.boton} onPress={continuar}><Text style={s.botonTxt}>Continuar</Text></Pressable>
        ) : (
          <Pressable style={s.boton} onPress={confirmar}><Text style={s.botonTxt}>Confirmar compra</Text></Pressable>
        )}
      </View>
    </View>
  );
}

// ---------- CONFIRMACIÓN ----------
function Confirmacion({ pedido, irCatalogo, irPedidos }) {
  return (
    <View style={{ flex: 1 }}>
      <Encabezado titulo="¡Pedido confirmado!" />
      <View style={s.vacio}>
        <Ionicons name="checkmark-circle" size={80} color={C.primario} />
        <Text style={s.subtitulo}>Código: {pedido.codigo}</Text>
        <Text style={s.vacioTxt}>Total: {formatoCOP(pedido.total)}</Text>
        <Text style={s.vacioTxt}>Esto es una simulación: no se realizó ningún cobro real.</Text>
        <Pressable style={s.boton} onPress={irPedidos}><Text style={s.botonTxt}>Ver mis pedidos</Text></Pressable>
        <Pressable style={{ marginTop: 14 }} onPress={irCatalogo}><Text style={{ color: C.primario, fontWeight: 'bold' }}>Seguir comprando</Text></Pressable>
      </View>
    </View>
  );
}

// ---------- MIS PEDIDOS: historial, seguimiento y cancelación ----------
function Pedidos({ pedidos, irCatalogo, avanzar, cancelar }) {
  const [selCodigo, setSelCodigo] = useState(null);
  const [confirmando, setConfirmando] = useState(false);
  const sel = pedidos.find((p) => p.codigo === selCodigo) || null;

  if (sel) {
    const final = sel.estado === 'Entregado' || sel.estado === 'Cancelado';
    const puedeCancelar = sel.estado === 'Confirmado' || sel.estado === 'Preparando';
    return (
      <View style={{ flex: 1 }}>
        <Encabezado titulo="Detalle del pedido" onVolver={() => { setSelCodigo(null); setConfirmando(false); }} />
        <ScrollView contentContainerStyle={{ padding: 20 }}>
          <Text style={s.subtitulo}>{sel.codigo}</Text>
          <Text style={s.gris}>{sel.fecha}</Text>
          <Text style={[s.estadoTxt, sel.estado === 'Cancelado' && { color: '#B00020' }]}>Estado: {sel.estado}</Text>
          {sel.direccion && (
            <Text style={[s.gris, { marginBottom: 12 }]}>
              Entrega: {sel.direccion.alias} - {sel.direccion.referencia}, {sel.direccion.municipio} ({nombreModalidad(sel.modalidad)}, {sel.plazo})
            </Text>
          )}
          {sel.items.map((it, i) => (
            <Text key={i} style={s.gris}>
              {it.cantidad} x {it.nombre}{it.etiqueta !== 'Única' ? ' (' + it.etiqueta + ')' : ''} ({formatoCOP(it.precioUnit)} c/u) - {formatoCOP(it.cantidad * it.precioUnit)}
            </Text>
          ))}
          <View style={{ height: 12 }} />
          <Resumen resumen={sel} hayProductos />

          <Text style={[s.subtitulo, { marginTop: 18 }]}>Seguimiento</Text>
          {sel.historialEstados.map((e, i) => (
            <View key={i} style={[s.fila, { marginVertical: 4 }]}>
              <Ionicons name="ellipse" size={12} color={C.primario} />
              <Text style={[s.resumenTxt, { marginLeft: 8 }]}>{e.estado}</Text>
              <Text style={[s.gris, { marginLeft: 8 }]}>{e.fecha}</Text>
            </View>
          ))}

          <Pressable style={[s.boton, { marginTop: 18 }, final && { backgroundColor: '#BBBBBB' }]} onPress={() => avanzar(sel.codigo)}>
            <Text style={s.botonTxt}>Simular avance de entrega</Text>
          </Pressable>

          {confirmando ? (
            <View style={s.caja}>
              <Text style={s.tarjetaNombre}>¿Seguro que quieres cancelar este pedido?</Text>
              <Text style={s.gris}>Las unidades volverán al inventario.</Text>
              <View style={[s.fila, { marginTop: 10 }]}>
                <Pressable style={[s.botonCupon, { flex: 1, marginRight: 8 }]} onPress={() => { cancelar(sel.codigo); setConfirmando(false); }}>
                  <Text style={s.botonTxt}>Sí, cancelar</Text>
                </Pressable>
                <Pressable style={[s.botonBorde, { flex: 1, marginTop: 0, height: 44 }]} onPress={() => setConfirmando(false)}>
                  <Text style={s.botonBordeTxt}>No</Text>
                </Pressable>
              </View>
            </View>
          ) : (
            <Pressable style={[s.botonBorde, !puedeCancelar && { opacity: 0.4 }]} onPress={() => (puedeCancelar ? setConfirmando(true) : cancelar(sel.codigo))}>
              <Text style={s.botonBordeTxt}>Cancelar pedido</Text>
            </Pressable>
          )}
        </ScrollView>
      </View>
    );
  }

  return (
    <View style={{ flex: 1 }}>
      <Encabezado titulo="Mis pedidos" eslogan="Seguimiento de tus compras" icono="cube" />
      {pedidos.length === 0 ? (
        <Vacio icono="cube-outline" mensaje="No hay pedidos registrados"
          detalle="Cuando confirmes una compra, aparecerá aquí."
          textoBoton="Ir al catálogo" onPress={irCatalogo} />
      ) : (
        <FlatList
          data={pedidos}
          keyExtractor={(p) => p.codigo}
          contentContainerStyle={{ padding: 20 }}
          renderItem={({ item }) => (
            <Pressable style={s.lineaCarrito} onPress={() => setSelCodigo(item.codigo)}>
              <View style={{ flex: 1 }}>
                <Text style={s.tarjetaNombre}>{item.codigo}</Text>
                <Text style={s.gris}>{item.fecha}</Text>
                <Text style={[s.estadoTxt, { marginTop: 2 }, item.estado === 'Cancelado' && { color: '#B00020' }]}>{item.estado}</Text>
              </View>
              <Text style={s.precio}>{formatoCOP(item.total)}</Text>
            </Pressable>
          )}
        />
      )}
    </View>
  );
}

// ---------- MÁS (menú) ----------
function Mas({ irA, noLeidas, nComparacion }) {
  const filas = [
    { id: 'notificaciones', icono: 'notifications-outline', texto: 'Notificaciones', extra: noLeidas > 0 ? noLeidas + ' sin leer' : '' },
    { id: 'direcciones', icono: 'location-outline', texto: 'Mis direcciones', extra: '' },
    { id: 'comparador', icono: 'git-compare-outline', texto: 'Comparador', extra: nComparacion > 0 ? nComparacion + ' en la lista' : '' },
    { id: 'ayuda', icono: 'help-circle-outline', texto: 'Centro de ayuda', extra: '' },
    { id: 'vendedor', icono: 'storefront-outline', texto: 'Panel de vendedor', extra: '' },
  ];
  return (
    <View style={{ flex: 1 }}>
      <Encabezado titulo="Más" eslogan="Todo lo demás de tu cuenta" icono="menu" />
      <ScrollView contentContainerStyle={{ padding: 20 }}>
        {filas.map((f) => (
          <Pressable key={f.id} style={s.lineaCarrito} onPress={() => irA(f.id)}>
            <Ionicons name={f.icono} size={26} color={C.primario} />
            <Text style={[s.tarjetaNombre, { flex: 1, marginLeft: 14, fontSize: 16 }]}>{f.texto}</Text>
            {f.extra !== '' && <Text style={s.gris}>{f.extra}</Text>}
            <Ionicons name="chevron-forward" size={20} color={C.gris} style={{ marginLeft: 6 }} />
          </Pressable>
        ))}
      </ScrollView>
    </View>
  );
}

// ---------- NOTIFICACIONES ----------
function Notificaciones({ notificaciones, abrir, volver }) {
  return (
    <View style={{ flex: 1 }}>
      <Encabezado titulo="Notificaciones" eslogan="Avisos dentro de la app" icono="notifications" onVolver={volver} />
      {notificaciones.length === 0 ? (
        <Vacio icono="notifications-off-outline" mensaje="No tienes notificaciones"
          detalle="Aquí verás los cambios de tus pedidos y los avisos de reposición." />
      ) : (
        <FlatList
          data={notificaciones}
          keyExtractor={(n) => n.id}
          contentContainerStyle={{ padding: 20 }}
          renderItem={({ item }) => (
            <Pressable style={[s.lineaCarrito, !item.leida && { borderWidth: 1.5, borderColor: C.primario }]} onPress={() => abrir(item.id)}>
              <Ionicons name={item.leida ? 'mail-open-outline' : 'mail-unread'} size={24} color={C.primario} />
              <View style={{ flex: 1, marginLeft: 12 }}>
                <Text style={[s.tarjetaNombre, !item.leida && { color: C.primario }]}>{item.mensaje}</Text>
                <Text style={s.gris}>{item.tipo} - {item.fecha}</Text>
              </View>
              {!item.leida && <View style={s.punto} />}
            </Pressable>
          )}
        />
      )}
    </View>
  );
}

// ---------- DIRECCIONES ----------
function Direcciones({ direcciones, guardar, hacerPrincipal, volver }) {
  const vacio = { alias: '', municipio: '', referencia: '' };
  const [form, setForm] = useState(vacio);
  const [editId, setEditId] = useState(null);
  const [error, setError] = useState('');

  const guardarForm = () => {
    if (form.alias.trim() === '') return setError('El alias no puede estar vacío');
    if (!form.municipio) return setError('Elige un municipio');
    if (form.referencia.trim().length < 5) return setError('La referencia de entrega debe tener al menos 5 caracteres');
    setError('');
    guardar({ alias: form.alias.trim(), municipio: form.municipio, referencia: form.referencia.trim() }, editId);
    setForm(vacio);
    setEditId(null);
  };

  const editar = (d) => {
    setEditId(d.id);
    setForm({ alias: d.alias, municipio: d.municipio, referencia: d.referencia });
    setError('');
  };

  const cancelar = () => { setEditId(null); setForm(vacio); setError(''); };

  return (
    <View style={{ flex: 1 }}>
      <Encabezado titulo="Mis direcciones" eslogan="Usa solo datos ficticios" icono="location" onVolver={volver} />
      <ScrollView contentContainerStyle={{ padding: 20 }}>
        <Text style={s.subtitulo}>{editId ? 'Editando dirección' : 'Nueva dirección'}</Text>
        <TextInput style={s.input} placeholder="Alias (ej. Casa)" value={form.alias} onChangeText={(v) => setForm({ ...form, alias: v })} />
        <Text style={[s.gris, { marginBottom: 6 }]}>Municipio</Text>
        <View style={[s.wrap, { marginBottom: 12 }]}>
          {MUNICIPIOS.map((m) => (
            <Chip key={m} texto={m} activo={form.municipio === m} onPress={() => setForm({ ...form, municipio: m })} />
          ))}
        </View>
        <TextInput style={s.input} placeholder="Referencia de entrega" value={form.referencia} onChangeText={(v) => setForm({ ...form, referencia: v })} />
        {error !== '' && <Text style={[s.error, { marginBottom: 8 }]}>{error}</Text>}
        <Pressable style={s.boton} onPress={guardarForm}>
          <Text style={s.botonTxt}>{editId ? 'Guardar cambios' : 'Agregar dirección'}</Text>
        </Pressable>
        {editId && (
          <Pressable style={{ alignItems: 'center', marginTop: 12 }} onPress={cancelar}>
            <Text style={{ color: C.primario, fontWeight: 'bold' }}>Cancelar edición</Text>
          </Pressable>
        )}

        <Text style={[s.subtitulo, { marginTop: 24 }]}>Mis direcciones ({direcciones.length})</Text>
        {direcciones.length === 0 && <Text style={s.gris}>Aún no has registrado direcciones.</Text>}
        {direcciones.map((d) => (
          <View key={d.id} style={s.lineaCarrito}>
            <View style={{ flex: 1 }}>
              <Text style={s.tarjetaNombre}>{d.alias}{d.principal ? '  (Principal)' : ''}</Text>
              <Text style={s.gris}>{d.municipio} - {d.referencia}</Text>
              {!d.principal && (
                <Pressable onPress={() => hacerPrincipal(d.id)}>
                  <Text style={[s.link, { marginTop: 6 }]}>Marcar como principal</Text>
                </Pressable>
              )}
            </View>
            <Pressable style={s.btnRedondo} onPress={() => editar(d)}>
              <Ionicons name="create-outline" size={22} color={C.primario} />
            </Pressable>
          </View>
        ))}
      </ScrollView>
    </View>
  );
}

// ---------- COMPARADOR ----------
function Comparador({ productos, comparacion, quitar, volver, irCatalogo }) {
  const lista = comparacion.map((id) => productos.find((p) => p.id === id)).filter(Boolean);
  return (
    <View style={{ flex: 1 }}>
      <Encabezado titulo="Comparador" eslogan="De 2 a 3 productos" icono="git-compare" onVolver={volver} />
      {lista.length === 0 ? (
        <Vacio icono="git-compare-outline" mensaje="No has elegido productos"
          detalle="Toca el icono de comparar en las tarjetas del catálogo (máximo 3)."
          textoBoton="Ir al catálogo" onPress={irCatalogo} />
      ) : (
        <ScrollView contentContainerStyle={{ padding: 20 }}>
          {lista.length < 2 && <Text style={[s.error, { marginBottom: 10 }]}>Elige al menos 2 productos para comparar.</Text>}
          <View style={s.fila}>
            {lista.map((p) => (
              <View key={p.id} style={s.colComparar}>
                <View style={s.miniRecuadro}><Foto p={p} style={s.fotoMini} inicialesStyle={s.miniIniciales} /></View>
                <Text style={[s.tarjetaNombre, { marginTop: 8 }]}>{p.nombre}</Text>
                <Text style={s.gris}>Marca</Text>
                <Text style={s.resumenTxt}>{p.marca}</Text>
                <Text style={[s.gris, { marginTop: 6 }]}>Precio</Text>
                <Text style={s.precio}>{(hayVariantes(p) ? 'Desde ' : '') + formatoCOP(precioDesde(p))}</Text>
                <Text style={[s.gris, { marginTop: 6 }]}>Disponibilidad</Text>
                <Text style={s.resumenTxt}>{stockTotal(p) === 0 ? 'Agotado' : stockTotal(p) + ' unidades'}</Text>
                <Pressable style={{ marginTop: 10 }} onPress={() => quitar(p.id)}>
                  <Text style={s.link}>Quitar</Text>
                </Pressable>
              </View>
            ))}
          </View>
        </ScrollView>
      )}
    </View>
  );
}

// ---------- AYUDA ----------
function Ayuda({ pedidos, tickets, crear, simularRespuesta, volver }) {
  const [pedidoSel, setPedidoSel] = useState(null);
  const [motivo, setMotivo] = useState(null);
  const [descripcion, setDescripcion] = useState('');
  const [error, setError] = useState('');

  const enviar = () => {
    const errores = [];
    if (!pedidoSel) errores.push('Selecciona un pedido');
    if (!motivo) errores.push('Elige un motivo');
    if (descripcion.trim().length < 15) errores.push('La descripción debe tener al menos 15 caracteres');
    if (errores.length > 0) return setError(errores.join('. '));
    setError('');
    crear(pedidoSel, motivo, descripcion.trim());
    setPedidoSel(null);
    setMotivo(null);
    setDescripcion('');
  };

  return (
    <View style={{ flex: 1 }}>
      <Encabezado titulo="Centro de ayuda" eslogan="Cuéntanos qué pasó con tu pedido" icono="help-circle" onVolver={volver} />
      <ScrollView contentContainerStyle={{ padding: 20 }}>
        <Text style={s.subtitulo}>Nueva solicitud</Text>
        <Text style={[s.gris, { marginBottom: 6 }]}>Pedido</Text>
        {pedidos.length === 0 && <Text style={s.gris}>Aún no tienes pedidos para reportar.</Text>}
        <View style={s.wrap}>
          {pedidos.map((p) => (
            <Chip key={p.codigo} texto={p.codigo} activo={pedidoSel === p.codigo} onPress={() => setPedidoSel(p.codigo)} />
          ))}
        </View>
        <Text style={[s.gris, { marginTop: 12, marginBottom: 6 }]}>Motivo</Text>
        <View style={s.wrap}>
          {MOTIVOS.map((m) => (
            <Chip key={m} texto={m} activo={motivo === m} onPress={() => setMotivo(m)} />
          ))}
        </View>
        <TextInput
          style={[s.input, { height: 90, paddingTop: 12, textAlignVertical: 'top', marginTop: 12 }]}
          placeholder="Describe el inconveniente (mínimo 15 caracteres)"
          multiline
          value={descripcion}
          onChangeText={setDescripcion}
        />
        {error !== '' && <Text style={[s.error, { marginBottom: 8 }]}>{error}</Text>}
        <Pressable style={s.boton} onPress={enviar}><Text style={s.botonTxt}>Enviar solicitud</Text></Pressable>

        <Text style={[s.subtitulo, { marginTop: 24 }]}>Mis solicitudes ({tickets.length})</Text>
        {tickets.length === 0 && <Text style={s.gris}>Todavía no has registrado solicitudes.</Text>}
        {tickets.map((t) => (
          <View key={t.id} style={s.caja}>
            <Text style={s.tarjetaNombre}>{t.id} - {t.estado}</Text>
            <Text style={s.gris}>Pedido {t.pedidoCodigo} - {t.motivo} - {t.fecha}</Text>
            <Text style={[s.resumenTxt, { marginTop: 4 }]}>{t.descripcion}</Text>
            {t.respuesta ? (
              <Text style={s.respuesta}>{t.respuesta}</Text>
            ) : (
              <Pressable style={{ marginTop: 8 }} onPress={() => simularRespuesta(t.id)}>
                <Text style={s.link}>Simular respuesta (solo demostración)</Text>
              </Pressable>
            )}
          </View>
        ))}
      </ScrollView>
    </View>
  );
}

// ---------- PANEL DE VENDEDOR ----------
function Vendedor({ productos, guardar }) {
  const formVacio = { nombre: '', categoria: 'Hogar', precio: '', stock: '', descripcion: '' };
  const sinError = { campo: '', motivo: '' };
  const [form, setForm] = useState(formVacio);
  const [editId, setEditId] = useState(null);
  const [error, setError] = useState(sinError);
  const categorias = CATEGORIAS.filter((c) => c !== 'Todas');

  const cambiar = (campo, valor) => setForm({ ...form, [campo]: valor });

  // Devuelve el error, o null si todo está bien
  const validar = () => {
    const precio = Number(form.precio);
    if (form.nombre.trim() === '')
      return { campo: 'nombre', motivo: 'El nombre no puede estar vacío' };
    if (!/^\d+$/.test(form.precio.trim()) || precio <= 0)
      return { campo: 'precio', motivo: 'El precio debe ser un número entero mayor que 0' };
    if (!/^\d+$/.test(form.stock.trim()))
      return { campo: 'stock', motivo: 'El stock debe ser un número entero de 0 o más' };
    if (form.descripcion.trim().length < 15)
      return { campo: 'descripcion', motivo: 'La descripción debe tener al menos 15 caracteres' };
    return null;
  };

  const rojo = (campo) => (error.campo === campo ? { borderColor: '#B00020' } : null);

  const guardarForm = () => {
    const fallo = validar();
    if (fallo) return setError(fallo);
    setError(sinError);
    guardar(
      {
        nombre: form.nombre.trim(),
        categoria: form.categoria,
        precio: Number(form.precio),
        stock: Number(form.stock),
        descripcion: form.descripcion.trim(),
      },
      editId
    );
    setForm(formVacio);
    setEditId(null);
  };

  const editar = (p) => {
    setEditId(p.id);
    setForm({
      nombre: p.nombre,
      categoria: p.categoria,
      precio: String(p.variantes[0].precio),
      stock: String(stockTotal(p)),
      descripcion: p.descripcion,
    });
    setError(sinError);
  };

  const cancelar = () => {
    setEditId(null);
    setForm(formVacio);
    setError(sinError);
  };

  return (
    <View style={{ flex: 1 }}>
      <Encabezado titulo="Panel de vendedor" eslogan="Crea y edita tus productos" icono="storefront" />
      <ScrollView contentContainerStyle={{ padding: 20 }}>
        <Text style={s.subtitulo}>{editId ? 'Editando ' + editId : 'Nuevo producto'}</Text>

        <TextInput style={[s.input, rojo('nombre')]} placeholder="Nombre del producto" value={form.nombre} onChangeText={(v) => cambiar('nombre', v)} />
        <TextInput style={[s.input, rojo('precio')]} placeholder="Precio en COP (ej. 25000)" keyboardType="numeric" value={form.precio} onChangeText={(v) => cambiar('precio', v)} />
        <TextInput style={[s.input, rojo('stock')]} placeholder="Stock (unidades)" keyboardType="numeric" value={form.stock} onChangeText={(v) => cambiar('stock', v)} />
        <TextInput
          style={[s.input, { height: 90, paddingTop: 12, textAlignVertical: 'top' }, rojo('descripcion')]}
          placeholder="Descripción (mínimo 15 caracteres)"
          multiline
          value={form.descripcion}
          onChangeText={(v) => cambiar('descripcion', v)}
        />

        <Text style={[s.gris, { marginBottom: 6 }]}>Categoría</Text>
        <View style={[s.wrap, { marginBottom: 12 }]}>
          {categorias.map((c) => (
            <Chip key={c} texto={c} activo={c === form.categoria} onPress={() => cambiar('categoria', c)} />
          ))}
        </View>

        {error.motivo !== '' && <Text style={[s.error, { marginBottom: 8 }]}>{error.motivo}</Text>}

        <Pressable style={s.boton} onPress={guardarForm}>
          <Text style={s.botonTxt}>{editId ? 'Guardar cambios' : 'Crear producto'}</Text>
        </Pressable>
        {editId && (
          <Pressable style={{ alignItems: 'center', marginTop: 12 }} onPress={cancelar}>
            <Text style={{ color: C.primario, fontWeight: 'bold' }}>Cancelar edición</Text>
          </Pressable>
        )}

        <Text style={[s.subtitulo, { marginTop: 24 }]}>Mis productos ({productos.length})</Text>
        {productos.map((p) => (
          <View key={p.id} style={s.lineaCarrito}>
            <View style={{ flex: 1 }}>
              <Text style={s.tarjetaNombre}>{p.nombre}</Text>
              <Text style={s.gris}>{p.id} - {p.categoria} - Stock: {stockTotal(p)}</Text>
              <Text style={s.precio}>{(hayVariantes(p) ? 'Desde ' : '') + formatoCOP(precioDesde(p))}</Text>
            </View>
            <Pressable style={s.btnRedondo} onPress={() => editar(p)}>
              <Ionicons name="create-outline" size={22} color={C.primario} />
            </Pressable>
          </View>
        ))}
      </ScrollView>
    </View>
  );
}

// ====================== APP PRINCIPAL ======================
const TABS = [
  { id: 'catalogo', nombre: 'Catálogo', icono: 'home-outline' },
  { id: 'favoritos', nombre: 'Favoritos', icono: 'heart-outline' },
  { id: 'carrito', nombre: 'Carrito', icono: 'cart-outline' },
  { id: 'pedidos', nombre: 'Pedidos', icono: 'cube-outline' },
  { id: 'mas', nombre: 'Más', icono: 'menu-outline' },
];
const SUBPANTALLAS = ['notificaciones', 'direcciones', 'comparador', 'ayuda', 'vendedor'];

export default function App() {
  // Estados: todo vive en memoria (useState)
  const [fuentesListas] = useFonts({ Fredoka_700Bold });
  const [productos, setProductos] = useState(PRODUCTOS_INICIALES);
  const [carrito, setCarrito] = useState([]);
  const [favoritos, setFavoritos] = useState([]);
  const [pedidos, setPedidos] = useState(PEDIDOS_INICIALES);
  const [valoraciones, setValoraciones] = useState({});
  const [pantalla, setPantalla] = useState('catalogo');
  const [anterior, setAnterior] = useState('catalogo');
  const [productoSel, setProductoSel] = useState(null);
  const [ultimoPedido, setUltimoPedido] = useState(null);
  const [cuponActivo, setCuponActivo] = useState(false);
  const [aviso, setAviso] = useState('');
  const [busqueda, setBusqueda] = useState('');
  const [categoria, setCategoria] = useState('Todas');
  const [orden, setOrden] = useState('asc');
  // Taller 5
  const [filtros, setFiltros] = useState(FILTROS_VACIOS);
  const [comparacion, setComparacion] = useState([]);
  const [consultas, setConsultas] = useState(CONSULTAS_INICIALES);
  const [direcciones, setDirecciones] = useState(DIRECCIONES_INICIALES);
  const [direccionSel, setDireccionSel] = useState(null);
  const [modalidad, setModalidad] = useState(null);
  const [comprador, setComprador] = useState({ nombre: '', telefono: '' });
  const [origenDir, setOrigenDir] = useState('mas');
  const [notificaciones, setNotificaciones] = useState([]);
  const [suscripciones, setSuscripciones] = useState([]);
  const [tickets, setTickets] = useState([]);

  const dirSel = direcciones.find((d) => d.id === direccionSel) || null;
  const infoEnv = dirSel && modalidad ? infoEnvio(dirSel.municipio, modalidad) : null;
  const resumen = calcularResumen(carrito, productos, cuponActivo, infoEnv ? infoEnv.costo : null);
  const noLeidas = notificaciones.filter((n) => !n.leida).length;
  const pestanaActiva = SUBPANTALLAS.includes(pantalla) ? 'mas' : pantalla;
  const mostrarBarra = !['detalle', 'checkout', 'confirmacion'].includes(pantalla);

  const avisar = (txt) => {
    setAviso(txt);
    setTimeout(() => setAviso(''), 2000);
  };

  const abrirDetalle = (p) => {
    if (pantalla !== 'detalle') setAnterior(pantalla); // así "volver" siempre regresa a la lista de origen
    setProductoSel(p);
    setPantalla('detalle');
  };

  const toggleFavorito = (id) =>
    setFavoritos((f) => (f.includes(id) ? f.filter((x) => x !== id) : [...f, id]));

  // ---------- COMPARADOR (no toca carrito, favoritos ni inventario) ----------
  const toggleComparar = (id) => {
    if (comparacion.includes(id)) return setComparacion(comparacion.filter((x) => x !== id));
    if (comparacion.length >= 3) return avisar('Máximo 3 productos para comparar');
    setComparacion([...comparacion, id]);
    avisar('Producto agregado al comparador');
  };

  // ---------- CARRITO ----------
  // AGREGAR: aumentar validando stock; recibe la variante
  const agregar = (id, varianteId) => {
    if (!varianteId) return avisar('Elige una variante antes de agregar al carrito');
    const { v } = buscarVariante(productos, id, varianteId);
    const linea = carrito.find((l) => l.id === id && l.varianteId === varianteId);
    const enCarrito = linea ? linea.cantidad : 0;
    if (v.stock === 0) return avisar('Esta variante está agotada');
    if (enCarrito >= v.stock) return avisar('Máximo permitido: ' + v.stock + ' unidades de esta variante');
    setCarrito(
      linea
        ? carrito.map((l) => (l.id === id && l.varianteId === varianteId ? { ...l, cantidad: l.cantidad + 1 } : l))
        : [...carrito, { id, varianteId, cantidad: 1 }]
    );
    avisar('Producto agregado al carrito');
  };

  // Al llegar a 0 la línea se elimina (nunca hay cantidades negativas)
  const disminuir = (id, varianteId) =>
    setCarrito(
      carrito
        .map((l) => (l.id === id && l.varianteId === varianteId ? { ...l, cantidad: l.cantidad - 1 } : l))
        .filter((l) => l.cantidad > 0)
    );

  const eliminar = (id, varianteId) => {
    setCarrito(carrito.filter((l) => !(l.id === id && l.varianteId === varianteId)));
    avisar('Producto eliminado');
  };

  // único cupón de prueba
  const aplicarCupon = (codigo) => {
    if (codigo.trim().toUpperCase() === 'BIENVENIDO10') {
      setCuponActivo(true);
      avisar('Cupón aplicado');
    } else {
      avisar('Cupón no válido');
    }
  };

  // valoración entera de 1 a 5
  const valorar = (id, n) => {
    if (!Number.isInteger(n) || n < 1 || n > 5) return avisar('La valoración debe ser de 1 a 5');
    setValoraciones({ ...valoraciones, [id]: [...(valoraciones[id] || []), n] });
    avisar('¡Gracias por tu valoración!');
  };

  // ---------- NOTIFICACIONES (la clave evita duplicados del mismo evento) ----------
  const notificar = (tipo, mensaje, referencia, clave) =>
    setNotificaciones((prev) =>
      prev.some((n) => n.id === clave) ? prev : [{ id: clave, tipo, mensaje, fecha: ahora(), leida: false, referencia }, ...prev]
    );

  const abrirNotificacion = (id) =>
    setNotificaciones((prev) => prev.map((n) => (n.id === id ? { ...n, leida: true } : n)));

  // ---------- COMPRA ----------
  const confirmarCompra = () => {
    if (carrito.length === 0) return avisar('Tu carrito está vacío');
    if (!dirSel || !infoEnv) return avisar('Elige una dirección y una modalidad de envío');
    for (const l of carrito) {
      const { p, v } = buscarVariante(productos, l.id, l.varianteId);
      if (l.cantidad > v.stock) return avisar('Sin stock suficiente de ' + p.nombre + ' (' + v.etiqueta + ')');
    }
    const codigo = 'ZV-' + Date.now();
    const fecha = ahora();
    const pedido = {
      codigo,
      fecha,
      comprador,
      direccion: { alias: dirSel.alias, municipio: dirSel.municipio, referencia: dirSel.referencia },
      modalidad,
      plazo: infoEnv.plazo,
      items: carrito.map((l) => {
        const { p, v } = buscarVariante(productos, l.id, l.varianteId);
        return { id: p.id, varianteId: v.id, nombre: p.nombre, etiqueta: v.etiqueta, cantidad: l.cantidad, precioUnit: v.precio };
      }),
      subtotal: resumen.subtotal,
      descuento: resumen.descuento,
      envio: resumen.envio,
      total: resumen.total,
      estado: 'Confirmado',
      historialEstados: [{ estado: 'Confirmado', fecha }],
      stockRestituido: false,
    };
    // descontar stock por variante
    setProductos(
      productos.map((p) => ({
        ...p,
        variantes: p.variantes.map((v) => {
          const l = carrito.find((x) => x.id === p.id && x.varianteId === v.id);
          return l ? { ...v, stock: v.stock - l.cantidad } : v;
        }),
      }))
    );
    setPedidos([pedido, ...pedidos]);
    setUltimoPedido(pedido);
    notificar('Pedido', 'Pedido ' + codigo + ': Confirmado', { tipo: 'pedido', id: codigo }, 'ped-' + codigo + '-Confirmado');
    setCarrito([]);
    setCuponActivo(false);
    setDireccionSel(null);
    setModalidad(null);
    setPantalla('confirmacion');
  };

  // ---------- SEGUIMIENTO Y CANCELACIÓN ----------
  const avanzarPedido = (codigo) => {
    const ped = pedidos.find((p) => p.codigo === codigo);
    if (!ped) return;
    if (ped.estado === 'Entregado' || ped.estado === 'Cancelado')
      return avisar('Este pedido ya no admite nuevos cambios de estado');
    const sig = ORDEN_ESTADOS[ORDEN_ESTADOS.indexOf(ped.estado) + 1];
    setPedidos(pedidos.map((p) => (p.codigo === codigo ? { ...p, estado: sig, historialEstados: [...p.historialEstados, { estado: sig, fecha: ahora() }] } : p)));
    notificar('Pedido', 'Pedido ' + codigo + ': ' + sig, { tipo: 'pedido', id: codigo }, 'ped-' + codigo + '-' + sig);
    avisar('Estado actualizado: ' + sig);
  };

  const cancelarPedido = (codigo) => {
    const ped = pedidos.find((p) => p.codigo === codigo);
    if (!ped) return;
    if (ped.estado === 'Cancelado') return avisar('Este pedido ya está cancelado');
    if (ped.estado !== 'Confirmado' && ped.estado !== 'Preparando')
      return avisar('No se puede cancelar: el pedido está "' + ped.estado + '" y ya salió del despacho');
    if (ped.stockRestituido) return avisar('Las unidades de este pedido ya fueron restituidas');
    // restituir exactamente las unidades originales de cada variante (una sola vez)
    setProductos(
      productos.map((p) => ({
        ...p,
        variantes: p.variantes.map((v) => {
          const it = ped.items.find((i) => i.varianteId === v.id);
          return it ? { ...v, stock: v.stock + it.cantidad } : v;
        }),
      }))
    );
    setPedidos(pedidos.map((p) => (p.codigo === codigo ? { ...p, estado: 'Cancelado', stockRestituido: true, historialEstados: [...p.historialEstados, { estado: 'Cancelado', fecha: ahora() }] } : p)));
    notificar('Pedido', 'Pedido ' + codigo + ': Cancelado', { tipo: 'pedido', id: codigo }, 'ped-' + codigo + '-Cancelado');
    avisar('Pedido cancelado y stock restituido');
  };

  // ---------- DIRECCIONES ----------
  const guardarDireccion = (datos, idEditar) => {
    if (idEditar) {
      setDirecciones(direcciones.map((d) => (d.id === idEditar ? { ...d, ...datos } : d)));
      avisar('Dirección actualizada');
    } else {
      setDirecciones([...direcciones, { id: 'DIR-' + Date.now(), ...datos, principal: direcciones.length === 0 }]);
      avisar('Dirección agregada');
    }
  };

  const hacerPrincipal = (id) => {
    setDirecciones(direcciones.map((d) => ({ ...d, principal: d.id === id })));
    avisar('Dirección principal actualizada');
  };

  const irDirecciones = (desde) => {
    setOrigenDir(desde);
    setPantalla('direcciones');
  };

  // ---------- PREGUNTAS ----------
  const preguntar = (productoId, texto) => {
    setConsultas([...consultas, { id: 'Q-' + Date.now(), productoId, pregunta: texto, respuesta: null, fecha: ahora(), estado: 'Pendiente' }]);
    avisar('Pregunta enviada: estado Pendiente');
  };

  const simularRespuesta = (id) => {
    setConsultas(consultas.map((c) => (c.id === id ? { ...c, estado: 'Respondida', respuesta: RESPUESTA_DEMO } : c)));
    avisar('Respuesta simulada');
  };

  // ---------- REPOSICIÓN ----------
  const suscribir = (productoId, varianteId) => {
    if (suscripciones.some((x) => x.varianteId === varianteId)) return avisar('Ya tienes un aviso activo para este artículo');
    setSuscripciones([...suscripciones, { productoId, varianteId }]);
    avisar('Te avisaremos cuando haya stock');
  };

  const cancelarSuscripcion = (varianteId) => {
    setSuscripciones(suscripciones.filter((x) => x.varianteId !== varianteId));
    avisar('Aviso de reposición cancelado');
  };

  const simularReposicion = (productoId, varianteId) => {
    const { p, v } = buscarVariante(productos, productoId, varianteId);
    if (!v || v.stock > 0) return avisar('Solo se puede reponer una variante agotada');
    const UNIDADES = 5;
    setProductos(
      productos.map((x) => (x.id !== productoId ? x : { ...x, variantes: x.variantes.map((y) => (y.id === varianteId ? { ...y, stock: y.stock + UNIDADES } : y)) }))
    );
    // solo se avisa si la suscripción sigue activa (si se canceló, no hay aviso)
    if (suscripciones.some((x) => x.varianteId === varianteId)) {
      const nombre = p.nombre + (hayVariantes(p) ? ' (' + v.etiqueta + ')' : '');
      notificar('Reposición', nombre + ' ya tiene unidades disponibles', { tipo: 'producto', id: productoId }, 'repo-' + varianteId + '-' + Date.now());
      setSuscripciones(suscripciones.filter((x) => x.varianteId !== varianteId));
    }
    avisar('Reposición simulada: +' + UNIDADES + ' unidades');
  };

  // ---------- AYUDA ----------
  const crearTicket = (pedidoCodigo, motivo, descripcion) => {
    const id = 'CASO-' + String(tickets.length + 1).padStart(4, '0');
    setTickets([{ id, pedidoCodigo, motivo, descripcion, estado: 'Abierto', respuesta: null, fecha: ahora() }, ...tickets]);
    avisar('Solicitud creada: ' + id);
  };

  const simularRespuestaTicket = (id) => {
    setTickets(tickets.map((t) => (t.id === id ? { ...t, estado: 'Respondido', respuesta: 'Respuesta de prueba: ' + 'este mensaje es simulado y no proviene de una persona.' } : t)));
    avisar('Respuesta simulada');
  };

  // ---------- VENDEDOR ----------
  const guardarProducto = (datos, idEditar) => {
    const { precio, stock, ...resto } = datos;
    if (idEditar) {
      setProductos(productos.map((p) => {
        if (p.id !== idEditar) return p;
        // Solo los productos con una variante permiten editar precio y stock desde el panel
        const variantes = p.variantes.length === 1 ? [{ ...p.variantes[0], precio, stock }] : p.variantes;
        return { ...p, ...resto, variantes };
      }));
      avisar('Producto actualizado');
    } else {
      const mayor = productos.reduce((m, p) => Math.max(m, parseInt(p.id.split('-')[1], 10) || 0), 0);
      const id = 'PROD-' + String(mayor + 1).padStart(3, '0');
      const ini = resto.nombre.slice(0, 2).toUpperCase();
      setProductos([...productos, { id, ini, marca: 'Zenvora', ...resto, precio, variantes: [{ id: id + '-U', etiqueta: 'Única', precio, stock }] }]);
      avisar('Producto creado: ' + id);
    }
  };

  const irCatalogo = () => setPantalla('catalogo');

  if (!fuentesListas) return null;
  return (
    <View style={{ flex: 1, backgroundColor: C.fondo }}>
      <StatusBar barStyle="light-content" />

      {pantalla === 'catalogo' && (
        <Catalogo
          productos={productos} favoritos={favoritos} toggleFavorito={toggleFavorito} abrirDetalle={abrirDetalle}
          busqueda={busqueda} setBusqueda={setBusqueda} categoria={categoria} setCategoria={setCategoria}
          orden={orden} setOrden={setOrden} filtros={filtros} setFiltros={setFiltros}
          comparacion={comparacion} toggleComparar={toggleComparar} irComparador={() => setPantalla('comparador')}
        />
      )}
      {pantalla === 'detalle' && productoSel && (
        <Detalle
          key={productoSel.id}
          producto={productos.find((p) => p.id === productoSel.id)}
          productos={productos}
          esFav={favoritos.includes(productoSel.id)} toggleFavorito={toggleFavorito} agregar={agregar}
          volver={() => setPantalla(anterior)} valoraciones={valoraciones} valorar={valorar}
          consultas={consultas} preguntar={preguntar} simularRespuesta={simularRespuesta}
          suscripciones={suscripciones} suscribir={suscribir} cancelarSuscripcion={cancelarSuscripcion}
          simularReposicion={simularReposicion} abrirDetalle={abrirDetalle}
        />
      )}
      {pantalla === 'favoritos' && (
        <Favoritos productos={productos} favoritos={favoritos} toggleFavorito={toggleFavorito}
          comparacion={comparacion} toggleComparar={toggleComparar} abrirDetalle={abrirDetalle} irCatalogo={irCatalogo} />
      )}
      {pantalla === 'carrito' && (
        <Carrito
          carrito={carrito} productos={productos} resumen={resumen} agregar={agregar} disminuir={disminuir}
          eliminar={eliminar} cuponActivo={cuponActivo} aplicarCupon={aplicarCupon}
          irCheckout={() => setPantalla('checkout')} irCatalogo={irCatalogo}
        />
      )}
      {pantalla === 'checkout' && (
        <Checkout
          carrito={carrito} productos={productos} resumen={resumen} confirmar={confirmarCompra}
          volver={() => setPantalla('carrito')} direcciones={direcciones} direccionSel={direccionSel}
          setDireccionSel={setDireccionSel} modalidad={modalidad} setModalidad={setModalidad}
          comprador={comprador} setComprador={setComprador} irDirecciones={() => irDirecciones('checkout')}
        />
      )}
      {pantalla === 'confirmacion' && ultimoPedido && (
        <Confirmacion pedido={ultimoPedido} irCatalogo={irCatalogo} irPedidos={() => setPantalla('pedidos')} />
      )}
      {pantalla === 'pedidos' && <Pedidos pedidos={pedidos} irCatalogo={irCatalogo} avanzar={avanzarPedido} cancelar={cancelarPedido} />}
      {pantalla === 'mas' && (
        <Mas irA={(id) => (id === 'direcciones' ? irDirecciones('mas') : setPantalla(id))} noLeidas={noLeidas} nComparacion={comparacion.length} />
      )}
      {pantalla === 'notificaciones' && <Notificaciones notificaciones={notificaciones} abrir={abrirNotificacion} volver={() => setPantalla('mas')} />}
      {pantalla === 'direcciones' && (
        <Direcciones direcciones={direcciones} guardar={guardarDireccion} hacerPrincipal={hacerPrincipal} volver={() => setPantalla(origenDir)} />
      )}
      {pantalla === 'comparador' && (
        <Comparador productos={productos} comparacion={comparacion} quitar={toggleComparar} volver={() => setPantalla('mas')} irCatalogo={irCatalogo} />
      )}
      {pantalla === 'ayuda' && (
        <Ayuda pedidos={pedidos} tickets={tickets} crear={crearTicket} simularRespuesta={simularRespuestaTicket} volver={() => setPantalla('mas')} />
      )}
      {pantalla === 'vendedor' && <Vendedor productos={productos} guardar={guardarProducto} />}

      {aviso !== '' && (
        <View style={s.toast}><Text style={s.toastTxt}>{aviso}</Text></View>
      )}

      {mostrarBarra && (
        <View style={s.barra}>
          {TABS.map((t) => (
            <Pressable key={t.id} onPress={() => setPantalla(t.id)} style={{ alignItems: 'center' }}>
              <View>
                <Ionicons name={t.icono} size={26} color={pestanaActiva === t.id ? C.primario : C.texto} />
                {t.id === 'mas' && noLeidas > 0 && (
                  <View style={s.insignia}><Text style={s.insigniaTxt}>{noLeidas}</Text></View>
                )}
              </View>
              <Text style={{ fontSize: 12, color: pestanaActiva === t.id ? C.primario : C.texto }}>{t.nombre}</Text>
            </Pressable>
          ))}
        </View>
      )}
    </View>
  );
}

// ====================== ESTILOS ======================
const s = StyleSheet.create({
  fila: { 
    flexDirection: 'row', 
    alignItems: 'center' 
  },

  wrap: { 
    flexDirection: 'row', 
    flexWrap: 'wrap', 
    gap: 8 
  },

  gris: { 
    color: C.gris, 
    fontSize: 14 
  },

  encabezado: { 
    backgroundColor: C.primario, 
    paddingTop: 48, 
    paddingHorizontal: 20, 
    paddingBottom: 24, 
    borderBottomLeftRadius: 32, 
    borderBottomRightRadius: 32, 
    overflow: 'hidden' 
  },

  circuloGrande: { 
    position: 'absolute', 
    top: -60, 
    right: -40, 
    width: 180, 
    height: 180, 
    borderRadius: 90, 
    backgroundColor: 'rgba(255,255,255,0.12)' 
  },

  circuloPequeno: { 
    position: 'absolute', 
    bottom: -30, 
    right: 90, 
    width: 90, 
    height: 90, 
    borderRadius: 45, 
    backgroundColor: 'rgba(255,255,255,0.10)' 
  },

  iconoEnc: { 
    width: 48, 
    height: 48, 
    borderRadius: 24, 
    backgroundColor: C.blanco, 
    alignItems: 'center', 
    justifyContent: 'center', 
    marginRight: 12 
  },

  marca: { 
    color: C.blanco, 
    fontSize: 32, 
    fontFamily: 'Fredoka_700Bold' 
  },

  eslogan: { 
    color: C.blanco, 
    fontSize: 13 
  },
  btnRedondo: { 
    width: 40, 
    height: 40, 
    borderRadius: 20, 
    backgroundColor: C.blanco, 
    alignItems: 'center', 
    justifyContent: 'center' 
  },

  buscador: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    backgroundColor: C.blanco, 
    borderRadius: 12, 
    paddingHorizontal: 12, 
    marginTop: 14, 
    height: 44 
  },

  inputBuscar: { 
    flex: 1, 
    marginLeft: 8, 
    fontSize: 15 
  },

  chips: { 
    paddingHorizontal: 16, 
    paddingVertical: 14, 
    gap: 8 
  },

  chip: { 
    borderWidth: 1.5, 
    borderColor: C.primario, 
    borderRadius: 14, 
    paddingHorizontal: 12, 
    paddingVertical: 6, 
    backgroundColor: C.blanco 
  },

  chipOn: { 
    backgroundColor: C.primario 
  },

  chipTxt: { 
    color: C.primario, 
    fontWeight: '600' 
  },

  tarjeta: { 
    width: '47%', 
    backgroundColor: C.blanco, 
    borderRadius: 16, 
    marginBottom: 16, 
    overflow: 'hidden' 
  },
  recuadro: { 
    aspectRatio: 1, 
    backgroundColor: C.suave, 
    alignItems: 'center', 
    justifyContent: 'center' 
  },

  iniciales: { 
    fontSize: 36, 
    fontWeight: 'bold', 
    color: C.primario 
  },

  agotado: { 
    position: 'absolute', 
    top: 8, 
    left: 8, 
    backgroundColor: '#000', 
    color: C.blanco, 
    fontSize: 11, 
    paddingHorizontal: 8, 
    paddingVertical: 2, 
    borderRadius: 8, 
    overflow: 'hidden' 
  },

  corazon: { 
    position: 'absolute', 
    top: 8, 
    right: 8, 
    width: 32, 
    height: 32, 
    borderRadius: 16, 
    backgroundColor: C.blanco, 
    alignItems: 'center', 
    justifyContent: 'center' 
  },

  tarjetaNombre: { 
    fontWeight: 'bold', 
    fontSize: 14, 
    color: C.texto 
  },

  precio: { 
    color: C.primario, 
    fontWeight: 'bold', 
    fontSize: 15, 
    marginTop: 2 
  },

  heroDetalle: { 
    height: 260, 
    backgroundColor: C.primario, 
    alignItems: 'center', 
    justifyContent: 'center' 
  },

  inicialesGrandes: { 
    fontSize: 80, 
    fontWeight: 'bold', 
    color: C.suave 
  },

  etiqueta: { 
    alignSelf: 'flex-start', 
    backgroundColor: C.primario, 
    borderRadius: 10, 
    paddingHorizontal: 12, 
    paddingVertical: 4 
  },

  tituloDetalle: { 
    fontSize: 24, 
    fontWeight: 'bold', 
    marginVertical: 8, 
    color: C.texto 
  },

  precioGrande: { 
    fontSize: 28, 
    fontWeight: 'bold', 
    color: C.primario 
  },

  botonTxt: { 
    color: C.blanco, 
    fontWeight: 'bold', 
    fontSize: 16 
  },

  vacio: { 
    flex: 1, 
    alignItems: 'center', 
    justifyContent: 'center', 
    padding: 30 
  },

  vacioTxt: { 
    color: C.gris, 
    fontSize: 16, 
    textAlign: 'center', 
    marginVertical: 12 
  },

  circuloVacio: { 
    width: 120, 
    height: 120, 
    borderRadius: 60, 
    backgroundColor: C.suave, 
    alignItems: 'center', 
    justifyContent: 'center', 
    marginBottom: 20 
  },

  vacioTitulo: { 
    fontSize: 20, 
    fontWeight: 'bold', 
    color: C.texto, 
    textAlign: 'center' 
  },

  boton: { 
    backgroundColor: C.primario, 
    borderRadius: 14, 
    height: 50, 
    paddingHorizontal: 28, 
    alignItems: 'center', 
    justifyContent: 'center' 
  },

  botonBorde: { 
    borderWidth: 1.5, 
    borderColor: C.primario, 
    borderRadius: 14, 
    height: 50, 
    alignItems: 'center', 
    justifyContent: 'center', 
    marginTop: 10, 
    backgroundColor: C.blanco 
  },

  botonBordeTxt: { 
    color: C.primario, 
    fontWeight: 'bold', 
    fontSize: 16 
  },

  lineaCarrito: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    backgroundColor: C.blanco, 
    borderRadius: 18, 
    padding: 14, 
    marginBottom: 12 
  },

  miniRecuadro: { 
    width: 64, 
    height: 64, 
    borderRadius: 14, 
    backgroundColor: C.suave, 
    alignItems: 'center', 
    justifyContent: 'center', 
    overflow: 'hidden' 
  },

  miniIniciales: { 
    fontSize: 22, 
    fontWeight: 'bold', 
    color: C.primario 
  },

  btnCant: { 
    width: 30, 
    height: 30, 
    borderRadius: 15, 
    alignItems: 'center',
    justifyContent: 'center' 
  },

  btnCantTxt: { 
    fontSize: 18, 
    fontWeight: 'bold' 
  },

  cantidad: { 
    marginHorizontal: 14, 
    fontSize: 16, 
    fontWeight: 'bold' 
  },

  inputCupon: {   
  flex: 1, 
  borderWidth: 1.5, 
  borderColor: C.primario, 
  borderRadius: 12, 
  backgroundColor: C.blanco, 
  paddingHorizontal: 12, 
  height: 44, 
  marginRight: 8 
},

  botonCupon: { 
    backgroundColor: C.primario, 
    borderRadius: 12, 
    paddingHorizontal: 18, 
    height: 44, 
    alignItems: 'center', 
    justifyContent: 'center' 
  },

  cajaResumen: { 
    backgroundColor: C.blanco, 
    borderRadius: 18, 
    padding: 16 
  },

  resumenTxt: { 
    fontSize: 15, 
    color: C.texto 
  },

  resumenTotal: { 
    color: C.primario, 
    fontWeight: 'bold', 
    fontSize: 17 
  },

  aviso2: { 
    textAlign: 'center', 
    color: C.gris, 
    fontSize: 12, 
    marginBottom: 8 
  },

  input: { 
    backgroundColor: C.blanco, 
    borderRadius: 12, 
    borderWidth: 1.5, 
    borderColor: C.primario, 
    paddingHorizontal: 14, 
    height: 48, 
    marginBottom: 12, 
    fontSize: 15 
  },

  error: { 
    color: '#B00020', 
    fontSize: 14, 
    marginTop: 4 
  },

  subtitulo: { 
    fontSize: 18, 
    fontWeight: 'bold', 
    color: C.primario, 
    marginBottom: 4 
  },
  
  toast: { 
    position: 'absolute', 
    top: 50, 
    left: 20, 
    right: 20, 
    backgroundColor: '#222', 
    borderRadius: 12, 
    padding: 12, 
    alignItems: 'center' 
  },

  toastTxt: { 
    color: C.blanco, 
    fontSize: 14 
  },

  barra: { 
    flexDirection: 'row', 
    justifyContent: 'space-around', 
    backgroundColor: C.blanco, 
    paddingVertical: 10, 
    paddingBottom: 16 
  },

  fotoTarjeta: { 
    width: '100%', 
    height: '100%' 
  },

  fotoMini: { 
    width: '100%', 
    height: '100%' 
  },

  fotoHero: { 
    position: 'absolute', 
    width: '100%', 
    height: '100%' 
  },

  caja: { 
    backgroundColor: C.blanco, 
    borderRadius: 14, 
    padding: 12, 
    marginTop: 10, 
    borderWidth: 1, 
    borderColor: C.suave 
  },

  link: { 
    color: C.primario, 
    fontWeight: 'bold', 
    fontSize: 14 
  },

  respuesta: { 
    color: C.gris, 
    fontStyle: 'italic', 
    marginTop: 6 
  },

  panelFiltros: { 
    backgroundColor: C.blanco, 
    marginHorizontal: 16, 
    marginBottom: 12, 
    borderRadius: 16, 
    padding: 14 
  },

  tarjetaRel: { 
    width: 150, 
    backgroundColor: C.blanco, 
    borderRadius: 14, 
    marginRight: 12, 
    marginTop: 8, 
    overflow: 'hidden' 
  },

  recuadroRel: { 
    height: 100, 
    backgroundColor: C.suave, 
    alignItems: 'center', 
    justifyContent: 'center' 
  },

  estadoTxt: { 
    color: C.primario, 
    fontWeight: 'bold', 
    fontSize: 15, 
    marginTop: 6 
  },

  punto: { 
    width: 10, 
    height: 10, 
    borderRadius: 5, 
    backgroundColor: C.primario 
  },

  colComparar: { 
    flex: 1, 
    backgroundColor: C.blanco, 
    borderRadius: 14, 
    padding: 10, 
    marginRight: 8 
  },

  insignia: { 
    position: 'absolute', 
    top: -4, 
    right: -10, 
    minWidth: 18, 
    height: 18, 
    borderRadius: 9, 
    backgroundColor: '#B00020', 
    alignItems: 'center', 
    justifyContent: 'center', 
    paddingHorizontal: 4 
  },

  insigniaTxt: { 
    color: C.blanco, 
    fontSize: 11, 
    fontWeight: 'bold' 
  },
});