# Guía de CSS

## Variables CSS

Todas las propiedades de estilo deben usar variables definidas en `main.css`:

**Ubicación**: `frontend/src/assets/main.css`

### Variables Disponibles

```css
/* Colores */
--color-primary, --color-primary-hover, --color-primary-light
--color-secondary, --color-secondary-hover
--color-success, --color-danger, --color-warning, --color-info

/* Fondos */
--bg-body, --bg-page, --bg-card, --bg-input, --bg-hover

/* Texto */
--text-primary, --text-secondary, --text-muted, --text-dark, --text-white

/* Espaciado */
--spacing-xs: 0.25rem
--spacing-sm: 0.5rem
--spacing-md: 1rem
--spacing-lg: 1.5rem
--spacing-xl: 2rem
--spacing-2xl: 3rem

/* Border Radius */
--radius-sm, --radius-md, --radius-lg, --radius-xl, --radius-2xl, --radius-round

/* Sombras */
--shadow-sm, --shadow-md, --shadow-lg, --shadow-xl

/* Transiciones */
--transition-fast: 0.15s ease
--transition-base: 0.2s ease
--transition-slow: 0.3s ease

/* Fuentes */
--font-size-base: 1rem
--font-size-sm: 0.875rem
--font-size-xs: 0.75rem
--font-size-lg: 1.125rem
--font-size-xl: 1.25rem
--font-weight-normal: 400
--font-weight-bold: 700
```

---

## Reglas Obligatorias

### 1. Usar Variables CSS
```vue
<style scoped>
.componente {
  color: var(--text-primary);
  padding: var(--spacing-md);
  border-radius: var(--radius-md);
}
</style>
```

### 2. NO usar estilos inline
Nunca usar `style="..."`.

### 4. Siempre usar `<style scoped>`
Para evitar conflictos entre componentes.

### 5. Evitar `!important`
Porfa, que luego da mucho lio si se complica algo entre clases.

---

## Estructura de main.css

1. **Variables CSS** 
2. **Estilos globales** 
6. **Animaciones** 


---

