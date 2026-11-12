MIME        := application/vnd.excalidraw+json
PACOTE      := dist/linux-unpacked
OPT_DIR     := $(HOME)/.local/opt/academy-board
APPS_DIR    := $(HOME)/.local/share/applications
HICOLOR     := $(HOME)/.local/share/icons/hicolor
MIME_DIR    := $(HOME)/.local/share/mime
MIMEAPPS    := $(HOME)/.config/mimeapps.list
DESKTOP     := $(APPS_DIR)/academy-board.desktop
TAMANHOS    := $(patsubst resources/icons/%.png,%,$(wildcard resources/icons/*.png))

.PHONY: install uninstall deps lint test package docs

install:
	@test -d node_modules || { echo "Falta node_modules: rode 'npm install' em $(CURDIR)." >&2; exit 1; }
	npm run pacote
	rm -rf $(OPT_DIR)
	mkdir -p $(dir $(OPT_DIR))
	cp -a $(PACOTE) $(OPT_DIR)
	install -Dm644 resources/academy-board.svg $(HICOLOR)/scalable/apps/academy-board.svg
	@$(foreach t,$(TAMANHOS),install -Dm644 resources/icons/$(t).png $(HICOLOR)/$(t)/apps/academy-board.png;)
	@mkdir -p $(MIME_DIR)/packages
	@printf '%s\n' \
		'<?xml version="1.0" encoding="UTF-8"?>' \
		'<mime-info xmlns="http://www.freedesktop.org/standards/shared-mime-info">' \
		'  <mime-type type="$(MIME)">' \
		'    <comment>Desenho do Excalidraw</comment>' \
		'    <sub-class-of type="application/json"/>' \
		'    <generic-icon name="image-x-generic"/>' \
		'    <glob pattern="*.excalidraw"/>' \
		'  </mime-type>' \
		'</mime-info>' \
		> $(MIME_DIR)/packages/academy-board.xml
	update-mime-database $(MIME_DIR)
	@mkdir -p $(APPS_DIR)
	@printf '%s\n' \
		'[Desktop Entry]' \
		'Type=Application' \
		'Name=Academy Board' \
		'Comment=Quadro branco offline para aulas ao vivo' \
		'Exec=$(OPT_DIR)/academy-board %f' \
		'Icon=academy-board' \
		'Terminal=false' \
		'Categories=Graphics;' \
		'MimeType=$(MIME);' \
		'StartupWMClass=academy-board' \
		> $(DESKTOP)
	@! command -v desktop-file-validate >/dev/null || desktop-file-validate $(DESKTOP)
	@! command -v update-desktop-database >/dev/null || update-desktop-database -q $(APPS_DIR)
	@touch --no-create $(HICOLOR)
	@test ! -f $(HICOLOR)/icon-theme.cache || gtk-update-icon-cache -q -t -f $(HICOLOR)
	xdg-mime default academy-board.desktop $(MIME)
	@echo "Academy Board instalado: procure por 'Academy Board' no menu do GNOME ou abra um .excalidraw."

uninstall:
	rm -rf $(OPT_DIR)
	rm -f $(DESKTOP) $(HICOLOR)/scalable/apps/academy-board.svg $(MIME_DIR)/packages/academy-board.xml
	@$(foreach t,$(TAMANHOS),rm -f $(HICOLOR)/$(t)/apps/academy-board.png;)
	@test ! -f $(MIMEAPPS) || sed -i '\#^$(MIME)=academy-board.desktop;\?$$#d' $(MIMEAPPS)
	@test ! -d $(MIME_DIR)/packages || update-mime-database $(MIME_DIR)
	@! command -v update-desktop-database >/dev/null || update-desktop-database -q $(APPS_DIR)
	@touch --no-create $(HICOLOR)
	@test ! -f $(HICOLOR)/icon-theme.cache || gtk-update-icon-cache -q -t -f $(HICOLOR)

deps: node_modules

node_modules: package-lock.json
	npm ci

lint: deps
	npm run typecheck

test: deps
	npm test

package: deps
	@test -n "$(VERSION)" || { echo "Informe VERSION=x.y.z" >&2; exit 1; }
	npm run pacote
	tar -C dist -czf dist/academy-board-$(VERSION)-linux-x64.tar.gz linux-unpacked

.venv/bin/mkdocs: requirements-docs.txt
	@if command -v uv >/dev/null; then uv venv -q .venv && uv pip install -q -p .venv/bin/python -r requirements-docs.txt; else python3 -m venv .venv && .venv/bin/pip install -q -r requirements-docs.txt; fi
	touch $@

docs: .venv/bin/mkdocs
	.venv/bin/mkdocs build --strict

docs-serve: .venv/bin/mkdocs
	.venv/bin/mkdocs serve
