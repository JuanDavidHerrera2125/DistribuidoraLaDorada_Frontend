async function loadComponents({ navbar = false, sidebar = false, footer = false }) {
  if (navbar) {
    const navbarHtml = await fetch("../../components/navbar.html").then(r => r.text());
    document.getElementById("navbar").innerHTML = navbarHtml;
  }
  if (sidebar) {
    const sidebarHtml = await fetch("../../components/sidebar.html").then(r => r.text());
    document.getElementById("sidebar").innerHTML = sidebarHtml;
  }
  if (footer) {
    const footerHtml = await fetch("../../components/footer.html").then(r => r.text());
    document.getElementById("footer").innerHTML = footerHtml;
  }
}
