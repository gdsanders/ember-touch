abort "Please use Ruby 1.9 to build Ember-Touch.js!" if RUBY_VERSION !~ /^1\.9/

require "bundler/setup"
require "erb"
require 'rake-pipeline'
require "colored"

def pipeline
  Rake::Pipeline::Project.new("Assetfile")
end

def setup_uploader(root=Dir.pwd)
  require 'github_downloads'
  uploader = nil
  Dir.chdir(root) do
    uploader = GithubDownloads::Uploader.new
    uploader.authorize
  end
  uploader
end

def upload_file(uploader, filename, description, file)
  print "Uploading #{filename}..."
  if uploader.upload_file(filename, description, file)
    puts "Success"
  else
    puts "Failure"
  end
end


def generate_docs
  print "Generating docs .. "

  Dir.chdir("docs") do
    system("npm install") unless File.exist?('node_modules')
    # Unfortunately -q doesn't always work so we get output
    #
    system("./node_modules/.bin/yuidoc -q -t touch-theme")
  end

end

desc "Upload latest Ember-Touch.js build to GitHub repository"
task :upload_latest => [:clean, :dist] do
  uploader = setup_uploader
  upload_file(uploader, 'ember-touch-latest.js', "Ember-Touch.js Master", "dist/ember-touch.js")
end

desc "Generate API Docs"
task :generate_docs do
  generate_docs
end

desc "Build ember-touch.js"
task :dist do
  puts "Building Ember Touch..."
  pipeline.invoke
  puts "Done"
end

desc "Clean build artifacts from previous builds"
task :clean do
  puts "Cleaning build..."
  pipeline.clean
  puts "Done"
end

desc "Run tests with phantomjs"
task :test, [:suite] => :dist do |t, args|
  unless system("which phantomjs > /dev/null 2>&1")
    abort "PhantomJS is not installed. Download from http://phantomjs.org"
  end

  suites = {
    :default => ["package=all"],
    :all => ["package=all"]
  }

  if ENV['TEST']
    opts = [ENV['TEST']]
  else
    suite = args[:suite] || :default
    opts = suites[suite.to_sym]
  end

  unless opts
    abort "No suite named: #{suite}"
  end

  cmd = opts.map do |opt|
    "phantomjs tests/qunit/run-qunit.js \"file://localhost#{File.dirname(__FILE__)}/tests/index.html?#{opt}\""
  end.join(' && ')

  # Run the tests
  puts "Running: #{opts.join(", ")}"
  success = system(cmd)

  if success
    puts "Tests Passed".green
  else
    puts "Tests Failed".red
    exit(1)
  end
end

desc "Automatically run tests (Mac OS X only)"
task :autotest do
  system("kicker -e 'rake test' packages")
end

task :default => :dist
