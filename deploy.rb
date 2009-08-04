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

#TODO - accept deploy environment arg, pass on to CouchApp, only minify for production

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

puts ""
puts "Concatenating javascripts ..."

concatenation = secretary.concatenation
concatenation.save_to("_attachments/javascripts/all.js")
secretary.install_assets

puts "Converting sass to css ..."
system 'compass'

# TODO ... only minify for production

# puts "Minifying javascripts ..."
# File.open("_attachments/javascripts/all.js", 'w') { |file| file.write(JSMin.minify(concatenation.to_s)) }
# 
# puts "Minifying stylesheets ..."
# Dir.glob("_attachments/stylesheets/*.css").each do |css|
#   f = ""
#   File.open(css, 'r') {|file| f << CSSMin.minify(file)}
#   File.open("_attachments/stylesheets/#{File.basename(css)}", 'w') {|file| file.write(f)}
#   puts "Minified #{css}"
# end

 "Pushing up to CouchDB ..."
system "couchapp push"

puts "Deploy complete"
puts ""
