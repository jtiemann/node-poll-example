# build output dirs
BUILD_DIR = build
JS_BUILD_DIR = $(BUILD_DIR)/js
CSS_BUILD_DIR = $(BUILD_DIR)/css
IMG_BUILD_DIR = $(BUILD_DIR)/img
VENDOR_BUILD_DIR = $(BUILD_DIR)/vendor
TESTS_BUILD_DIR = test/build

# sources
TEMPLATES = $(shell find app -name '*.hbs')
STYLUS = $(shell find app/css -name '*.styl')
IMGS = $(shell find app/img -name '*.gif' -or -name '*.jpg' -or -name '*.png' -or -name '*.ico')
COFFEE = $(shell find app -name '*.coffee')
VENDOR = $(shell find vendor -name '*.js')
TESTS_COFFEE = $(shell find test -name '*.coffee')

# targets
JS = $(patsubst app/%.coffee, $(JS_BUILD_DIR)/%.js, $(COFFEE))
TEMPLATES_HBS = $(patsubst app/%.hbs, $(JS_BUILD_DIR)/%.hbs, $(TEMPLATES))
CSS = $(patsubst app/css/%.styl, $(CSS_BUILD_DIR)/%.css, $(STYLUS))
IMG = $(patsubst app/img/%, $(IMG_BUILD_DIR)/%, $(IMGS))
VENDOR_JS = $(patsubst vendor/%.js, $(VENDOR_BUILD_DIR)/%.js, $(VENDOR))
TESTS_JS = $(patsubst test/%.coffee, $(TESTS_BUILD_DIR)/%.js, $(TESTS_COFFEE))

#production
PROD_BUILD_DIR = prod-build
S3_FOLDER = your-s3-bucket/assets/v1/

all: build-setup $(JS) $(CSS) $(VENDOR_JS) $(TEMPLATES_HBS) $(TESTS_JS) $(IMG)

#------- watch --------------
watch:
	watch -q $(MAKE) all

.PHONY: watch

# Setup folders
build-setup:
	mkdir -p $(BUILD_DIR)
	mkdir -p log

# Handlebars templates
$(JS_BUILD_DIR)/%.hbs: app/%.hbs
	@echo Creating $@ $<
	@mkdir -p $(dir $@)
	cp $< $@

# Stylus
$(CSS_BUILD_DIR)/%.css: app/css/%.styl
	mkdir -p $(CSS_BUILD_DIR)
	@echo "Stylus $<"
	@stylus $< --out $(CSS_BUILD_DIR) --use nib

# Main JS files compilation
$(JS_BUILD_DIR)/%.js: app/%.coffee
	@echo "Coffee $< -- $@"
	@coffee -c -o $(@D) $<

# Vendor files
$(VENDOR_BUILD_DIR)/%.js: vendor/%.js
	@echo Creating $@ $<
	@mkdir -p $(dir $@)
	cp $< $@

# Test JS files
$(TESTS_BUILD_DIR)/%.js: test/%.coffee
	@echo "Tests Coffee $< -- $@"
	@coffee -c -o $(@D) $<

# Copy img files
$(IMG_BUILD_DIR)/%: app/img/%
	@mkdir -p $(dir $@)
	@echo "IMG $@ $<"
	cp $< $@

production:
	@echo "Building production files"
	node app.build.js
	rsync -rupE $(BUILD_DIR)/img/ $(PROD_BUILD_DIR)/img/

.PHONY: production

# Usage make deploy-assets S3_FOLDER='s3bucket/foo'
deploy-assets: production
	@echo "deploying assets $(S3_FOLDER)"
	s3cmd sync prod-build/ --guess-mime-type --acl-public s3://$(S3_FOLDER)
.PHONY: deploy-assets

#TESTS = test/*.js

#test:
#	@NODE_ENV=test ./node_modules/.bin/mocha \
#			--require should \
#			--reporter list \
#			--slow 20 \
#			--growl \
#			$(TESTS)
#.PHONY: test
