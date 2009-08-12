#!/usr/bin/ruby

#
# Simple deploy recipe to wrap up the moving parts
# of couchapp pushing based on .couchapprc settings,
# sprockets concatenation, compass sass compilation,
# jsmin compression and cssmin compression
#

require 'rubygems'
require 'sprockets'
require 'jsmin'
require 'cssmin'

deploy_env = ARGV && ARGV[0] ? ARGV[0] : 'default'

puts ""
puts "Deploying to #{deploy_env} environment ..."

secretary = Sprockets::Secretary.new(
  :asset_root => "_attachments",
  :load_path => "lib/javascripts",
  :source_files => [
    "lib/javascripts/jquery-*.js",
    "lib/javascripts/jquery.*.js",
    lambda { Dir.glob('lib/javascripts/*.js').reject { 
      |n| n =~ /application|controller/ }}.call, # Sprockets not cooperating ...
    "lib/json_data/*.js",
    "lib/javascripts/controller.js",
    "lib/javascripts/application.js"
  ].flatten
)


puts "Concatenating javascripts ..."

concatenation = secretary.concatenation
concatenation.save_to("_attachments/javascripts/all.js")
secretary.install_assets

puts "Converting sass to css ..."
system 'compass'

"Pushing up to CouchDB ..."
system "couchapp push #{deploy_env}"

puts "Deploy complete to #{deploy_env} environment"
puts ""
