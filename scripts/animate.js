const observer = new IntersectionObserver(entries =>
{
	entries.forEach(entry =>
	{
		entry.target.classList.toggle("show", entry.isIntersecting);
	});
});

document.querySelectorAll(".hide").forEach(element =>
{
	observer.observe(element);
});