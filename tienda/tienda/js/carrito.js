// ==========================================================
// CARRITO: muestra los productos guardados en localStorage
// (clave 'carrito'), permite cambiar cantidades, quitar
// productos y calcula el subtotal.
//
// Depende de js/utilidades.js: obtener(), guardar(),
// formatearPrecio() y actualizarContadorCarrito().
//
// Cada producto del carrito tiene esta forma (ver catalogo.js):
// { id, nombre, variante, precio, cantidad, imagen, stock }
// ==========================================================

(() => {
const contenidoCarrito = document.getElementById('carrito-contenido');
const totalCarrito = document.getElementById('carrito-total');
const botonCheckout = document.getElementById('btn-checkout');

if (!contenidoCarrito) return; // Evitar errores si se ejecuta en otra página

// ---------- Datos ----------

function leerCarrito() {
  const carrito = obtener('carrito');
  return Array.isArray(carrito) ? carrito : [];
}

// Piezas de un producto en el carrito (todas sus variantes), sin contar la fila "excepto"
function piezasDelProducto(carrito, id, excepto) {
  return carrito.reduce(
    (total, item, i) => (item.id === id && i !== excepto ? total + item.cantidad : total),
    0
  );
}

// Máximo de piezas que puede tener una fila sin pasarse del stock total del producto
// (el stock se comparte entre variantes, igual que en catalogo.js)
function maximoPermitido(carrito, indice) {
  const item = carrito[indice];
  const stock = Number(item.stock);
  if (!stock) return 99; // Por si el dato no trae stock
  return Math.max(1, stock - piezasDelProducto(carrito, item.id, indice));
}

function cambiarCantidad(indice, nuevaCantidad) {
  const carrito = leerCarrito();
  const item = carrito[indice];
  if (!item) return;

  const maximo = maximoPermitido(carrito, indice);
  const cantidad = Math.floor(Number(nuevaCantidad)) || 1;
  item.cantidad = Math.min(Math.max(cantidad, 1), maximo);

  guardar('carrito', carrito);
}

function eliminarProducto(indice) {
  const carrito = leerCarrito();
  carrito.splice(indice, 1);
  guardar('carrito', carrito);
}

// ---------- Dibujar ----------

function activarCheckout(activo) {
  botonCheckout.classList.toggle('disabled', !activo);
  botonCheckout.style.pointerEvents = activo ? 'auto' : 'none';
  if (activo) {
    botonCheckout.removeAttribute('aria-disabled');
    botonCheckout.removeAttribute('tabindex');
  } else {
    botonCheckout.setAttribute('aria-disabled', 'true');
    botonCheckout.setAttribute('tabindex', '-1');
  }
}

function crearFila(item, indice, carrito) {
  const maximo = maximoPermitido(carrito, indice);
  const fila = document.createElement('tr');
  fila.dataset.indice = indice;

  fila.innerHTML =
    '<td>' +
      '<div class="carrito__producto">' +
        '<img width="64" height="64" alt="">' +
        '<div>' +
          '<strong class="carrito__nombre"></strong>' +
          '<small class="carrito__variante"></small>' +
          (item.cantidad >= maximo ? '<small class="carrito__aviso">Máximo disponible en stock</small>' : '') +
        '</div>' +
      '</div>' +
    '</td>' +
    '<td data-label="Precio" class="carrito__precio"></td>' +
    '<td data-label="Cantidad">' +
      '<div class="cantidad">' +
        '<button type="button" class="cantidad__btn" data-accion="restar">−</button>' +
        '<input type="number" class="cantidad__input" inputmode="numeric" min="1">' +
        '<button type="button" class="cantidad__btn" data-accion="sumar">+</button>' +
      '</div>' +
    '</td>' +
    '<td data-label="Subtotal" class="carrito__subtotal"></td>' +
    '<td class="carrito__acciones">' +
      '<button type="button" class="carrito__quitar" data-accion="eliminar">Quitar</button>' +
    '</td>';

  // Los textos se asignan con textContent para no interpretar HTML guardado en localStorage
  const img = fila.querySelector('img');
  img.src = item.imagen;
  img.alt = item.nombre;
  img.addEventListener('error', () => { img.style.visibility = 'hidden'; }, { once: true });

  fila.querySelector('.carrito__nombre').textContent = item.nombre;
  fila.querySelector('.carrito__variante').textContent = item.variante || '';
  const precioReal = obtenerPrecioReal(item.id, item.varianteId || item.variante);
  fila.querySelector('.carrito__precio').textContent = formatearPrecio(precioReal);
  fila.querySelector('.carrito__subtotal').textContent = formatearPrecio(precioReal * item.cantidad);

  const input = fila.querySelector('.cantidad__input');
  input.value = item.cantidad;
  input.max = maximo;
  input.setAttribute('aria-label', 'Cantidad de ' + item.nombre);

  const restar = fila.querySelector('[data-accion="restar"]');
  restar.disabled = item.cantidad <= 1;
  restar.setAttribute('aria-label', 'Quitar una pieza de ' + item.nombre);

  const sumar = fila.querySelector('[data-accion="sumar"]');
  sumar.disabled = item.cantidad >= maximo;
  sumar.setAttribute('aria-label', 'Agregar una pieza de ' + item.nombre);

  fila.querySelector('[data-accion="eliminar"]')
    .setAttribute('aria-label', 'Quitar ' + item.nombre + ' del carrito');

  return fila;
}

function renderizarCarrito() {
  const carrito = leerCarrito();
  contenidoCarrito.innerHTML = '';

  if (carrito.length === 0) {
    contenidoCarrito.innerHTML =
      '<p class="vacio" id="carrito-vacio">Tu carrito está vacío. ' +
      '<a href="index.html#catalogo">Ve al catálogo</a> para agregar productos.</p>';
    totalCarrito.textContent = formatearPrecio(0) + ' MXN';
    activarCheckout(false);
    actualizarContadorCarrito();
    return;
  }

  const tabla = document.createElement('table');
  tabla.className = 'carrito__tabla';
  tabla.innerHTML =
    '<caption class="sr-only">Productos en tu carrito</caption>' +
    '<thead><tr>' +
      '<th scope="col">Producto</th>' +
      '<th scope="col">Precio</th>' +
      '<th scope="col">Cantidad</th>' +
      '<th scope="col">Subtotal</th>' +
      '<th scope="col"><span class="sr-only">Acciones</span></th>' +
    '</tr></thead>';

  const cuerpo = document.createElement('tbody');
  carrito.forEach((item, indice) => cuerpo.appendChild(crearFila(item, indice, carrito)));
  tabla.appendChild(cuerpo);
  contenidoCarrito.appendChild(tabla);

  const subtotal = carrito.reduce((total, item) => total + obtenerPrecioReal(item.id, item.varianteId || item.variante) * item.cantidad, 0);
  totalCarrito.textContent = formatearPrecio(subtotal) + ' MXN';
  activarCheckout(true);
  actualizarContadorCarrito();
}

// Vuelve a dibujar y regresa el foco al mismo control (para quien navega con teclado)
function actualizarYEnfocar(indice, accion) {
  renderizarCarrito();
  const fila = contenidoCarrito.querySelector('tr[data-indice="' + indice + '"]');
  const control = fila && fila.querySelector('[data-accion="' + accion + '"]');
  if (control && !control.disabled) {
    control.focus();
  } else if (fila) {
    fila.querySelector('.cantidad__input').focus();
  } else {
    // La fila ya no existe (se eliminó): enfocar el título de la sección
    const titulo = document.querySelector('#carrito h2');
    titulo.setAttribute('tabindex', '-1');
    titulo.focus();
  }
}

// ---------- Eventos ----------

// Botones +, − y Quitar
contenidoCarrito.addEventListener('click', (evento) => {
  const boton = evento.target.closest('[data-accion]');
  if (!boton) return;

  const fila = boton.closest('tr');
  const indice = Number(fila.dataset.indice);
  const cantidadActual = Number(fila.querySelector('.cantidad__input').value);
  const accion = boton.dataset.accion;

  if (accion === 'sumar') cambiarCantidad(indice, cantidadActual + 1);
  if (accion === 'restar') cambiarCantidad(indice, cantidadActual - 1);
  if (accion === 'eliminar') eliminarProducto(indice);

  actualizarYEnfocar(indice, accion);
});

// Cantidad escrita a mano (se aplica al salir del campo o presionar Enter)
contenidoCarrito.addEventListener('change', (evento) => {
  if (!evento.target.matches('.cantidad__input')) return;
  const indice = Number(evento.target.closest('tr').dataset.indice);
  cambiarCantidad(indice, evento.target.value);
  renderizarCarrito();
});

// Si el carrito cambia en otra pestaña (por ejemplo, se agrega algo desde el catálogo)
window.addEventListener('storage', (evento) => {
  if (evento.key === 'carrito' || evento.key === null) renderizarCarrito();
});

renderizarCarrito();

})();
