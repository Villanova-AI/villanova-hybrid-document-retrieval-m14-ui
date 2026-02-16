# UI for Agata

## Overview

This UI application is designed to be deployed and served using **Apache2**.  
It is not intended to be used as a standalone production server.

The application relies on specific Apache modules and directory structures as described below.

---

## Web Server Requirements

The application must be hosted under an **Apache2** web server environment.

### Required Apache Modules

The following Apache modules must be enabled:

- `mod_proxy`
- `mod_proxy_http`
- `mod_rewrite`

You can enable them (on Debian/Ubuntu systems) using:

```bash
sudo a2enmod proxy
sudo a2enmod proxy_http
sudo a2enmod rewrite
sudo systemctl restart apache2
```

Ensure that your Apache virtual host configuration allows:

- URL rewriting (`RewriteEngine On`)
- Reverse proxy configuration (if applicable to your deployment)

---

## Plugins

The application relies on multiple plugins, including third-party components.

All plugins are located in:

```
/plugins
```

This directory contains:

- Custom-developed plugins
- Integrated third-party plugins
- Supporting plugin assets

If you modify or upgrade any third-party plugin, ensure compatibility with the current UI version.

---

## Theme

The UI uses the **Material Dashboard** theme.

All theme-related files are located in:

```
/theme
```

This directory contains:

- Theme stylesheets
- Theme JavaScript assets
- Layout templates
- Static resources (fonts, icons, images)

---

## Deployment Notes

- Deploy the full application directory to the Apache document root or the configured VirtualHost directory.
- Ensure proper file permissions for Apache.
- Verify that proxy and rewrite rules are correctly configured (also in the ```.htaccess``` file which can be found in the root path)

Failure to enable the required Apache modules may result in routing failures or backend communication errors.