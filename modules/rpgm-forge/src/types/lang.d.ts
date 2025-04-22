declare global {
	type ForgeLang = ToString<ForgeI18n>
	interface ForgeI18n {
		SOMETHING
		CRAZY
	}
	interface RpgmLang extends ForgeLang { }
}

export { }
