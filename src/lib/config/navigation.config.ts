import { resolve } from '$app/paths';
import {
	ArrowsLeftRightIcon,
	BuildindStoreIcon,
	FileDescriptionIcon,
	HomeDotIcon,
	LayoutGridIcon,
	PackageIcon,
	ShoppingCartIcon,
	UserIcon,
	UsersIcon
} from '#lib/icons/outline/index.ts';
import type { NavChildItem, NavItem, NavSection } from '#lib/interfaces/index.ts';

type ChildInput = Omit<NavChildItem, 'href'>;
type ItemInput = Omit<NavItem, 'href' | 'children'> & { children?: ChildInput[] };

/** El href se resuelve desde la ruta: una sola fuente para el link y para el control de acceso */
function navChild(item: ChildInput): NavChildItem {
	return { ...item, href: resolve(item.route) };
}

function navItem({ children, ...item }: ItemInput): NavItem {
	return {
		...item,
		href: resolve(item.route),
		...(children && { children: children.map(navChild) })
	};
}

/**
 * Menú del panel de gestión (/panel), única fuente de verdad para el sidebar y el título del header.
 * Cada usuario ve solo los items que su rol puede abrir según `ROLE_ACCESS` (filterNavigation).
 * Un item con `children` también es una página: al hacer clic en él se abre directamente y sus
 * hijos se despliegan debajo mientras esté activo él o alguno de ellos.
 */
export const PANEL_NAVIGATION: NavSection[] = [
	{
		id: 'principal',
		label: 'Principal',
		items: [
			navItem({ id: 'inicio', label: 'Inicio', route: '/panel', icon: HomeDotIcon, exact: true }),
			navItem({
				id: 'venta',
				label: 'Ventas',
				route: '/panel/ventas',
				icon: ShoppingCartIcon,
				children: [
					{ id: 'historial-ventas', label: 'Historial de ventas', route: '/panel/ventas/historial' }
				]
			}),
			navItem({
				id: 'productos',
				label: 'Productos',
				route: '/panel/productos',
				icon: PackageIcon,
				children: [
					{ id: 'categorias', label: 'Categorías', route: '/panel/productos/categorias' },
					{ id: 'colores', label: 'Colores', route: '/panel/productos/colores' },
					{ id: 'tallas', label: 'Tallas', route: '/panel/productos/tallas' }
				]
			}),
			navItem({
				id: 'kardex',
				label: 'Kardex',
				route: '/panel/kardex',
				icon: ArrowsLeftRightIcon,
				children: [{ id: 'costos', label: 'Valor del stock', route: '/panel/kardex/costos' }]
			}),
			navItem({
				id: 'secciones',
				label: 'Secciones',
				route: '/panel/secciones',
				icon: LayoutGridIcon
			}),
			navItem({
				id: 'archivos',
				label: 'Archivos',
				route: '/panel/archivos',
				icon: FileDescriptionIcon
			}),
			navItem({ id: 'usuarios', label: 'Usuarios', route: '/panel/usuarios', icon: UsersIcon })
		]
	},
	{
		id: 'ajustes',
		label: 'Ajustes',
		items: [
			navItem({
				id: 'mi-negocio',
				label: 'Mi negocio',
				route: '/panel/mi-negocio',
				icon: BuildindStoreIcon
			}),
			navItem({ id: 'perfil', label: 'Mi perfil', route: '/panel/perfil', icon: UserIcon })
		]
	}
];
