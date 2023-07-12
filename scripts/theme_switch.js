const theme_switch_button = document.querySelector("#theme_switch");
const body = document.body;
const COLOR_THEME = "color_theme";

{
	// making sure color theme is null before setting is important because someone with system dark theme 
	// will change it to light and complain why its going back to dark mode when they switch page
	let color_theme = localStorage.getItem(COLOR_THEME);

	if (color_theme === null && window.matchMedia)
		localStorage.setItem(COLOR_THEME, color_theme = (window.matchMedia('(prefers-color-scheme: dark)').matches && "dark" || "light"));

	if (color_theme === "light")
	{
		theme_switch_button.classList.add("invert");
		body.classList.add("light_mode");
	}
}

theme_switch_button.addEventListener("click", () =>
{
	theme_switch_button.classList.toggle("invert");
	body.classList.toggle("light_mode");

	localStorage.setItem(COLOR_THEME, document.body.classList.contains("light_mode") && "light" || "dark");
})