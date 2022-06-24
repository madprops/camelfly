const { execSync } = require("child_process")
const fs = require("fs")
const open = require("open")

// Main object that holds everything
const CF = {}

// Main function
CF.main = function () {
  CF.get_args()
  CF.process()
}

// Get input and output paths
CF.get_args = function () {
  let args = process.argv.slice(2)
  
  if (args[0] && args[1]) {
    CF.input = fs.readFileSync(args[0], "utf-8")
    CF.output = args[1]
  } else {
    let clipboard = execSync("xclip -o -sel clip", { encoding: "utf-8" })

    if (!clipboard) {
      exit(0)
    }
    
    CF.input = clipboard
    CF.output = args[0] || "$editor"
  }
}

// Main processing function
CF.process = function () {
  // Get lines and remove multiple linebreaks
  let lines = CF.input.split("\n").map(x => x.trim())
  
  let sections = CF.get_sections(lines)
  let markdown = CF.generate_markdown(sections)

  CF.save_file(CF.output, markdown)
}

// Get sections of different types
// Like, single, list, image, link
CF.get_sections = function (lines) {
  let sections = []
  let level = 0
  let current_section

  for (let line of lines) {
    let url_parts = CF.get_url_parts(line)

    if (level === 0) {
      if (line.endsWith("{")) {
        let section = {type: "list", text: line.replace("{", "").trim(), items: []}
        sections.push(section)
        current_section = section
        level = 1
      } 
      
      else if (url_parts.type === "image") {
        sections.push({type: "image", url: url_parts.url, text: url_parts.text})
      } 
      
      else if (url_parts.type === "link") {
        sections.push({type: "link", url: url_parts.url, text: url_parts.text})
      } 

      else if (line === "") {
        sections.push({type: "space"})
      }
      
      else {
        sections.push({type: "single", text: line})
      }
    } else if (level === 1) {
      if (line.trim() === "}") {
        level = 0
      } else {
        current_section.items.push(line.trim())
      }
    }
  }

  return sections
}

// Generate markdown based on the sections
CF.generate_markdown = function (sections) {
  let md = ""

  for (let section of sections) {
    if (section.type === "list") {
      md += `${section.text}\n`
      
      for (let item of section.items) {
        md += `* ${item}\n`
      }
  
      md += "\n"
    } 
    
    else if (section.type === "single") {
      md += `${section.text}  \n`
    } 
    
    else if (section.type === "image") {
      md += `<img src="${section.url}" width="${section.text}">\n`
    } 
    
    else if (section.type === "link") {
      md += `[${section.text}](${section.url})  \n`
    }

    else if (section.type === "space") {
      md += "\n"
    }
  }

  return md.trim()
}

// Save a file to a path
CF.save_file = function (path, data) {
  if (path === "$editor") {
    fs.writeFileSync("/tmp/camelfly_output", data, "utf-8")
    open("/tmp/camelfly_output")
  } else {
    fs.writeFileSync(path, data, "utf-8")
  }
}

// Util: Check if it's an image url
CF.is_image = function (s) {
  if (s.startsWith("http")) {
    let exts = [".jpg", ".png", ".gif"]

    for (let ext of exts) {
      if (s.endsWith(ext)) {
        return true
      }
    }
  }

  return false
}

// Util: Check if it's a url
CF.is_link = function (s) {
  return s.startsWith("http")
}

// Util: Get url and text parts
CF.get_url_parts = function (s) {
  let type = ""
  let url = ""
  let text = []

  let split = s.split(" ").map(x => x.trim()).filter(x => x !== "")

  for (let item of split) {
    if (CF.is_image(item)) {
      url = item
      type = "image"
    } else if (CF.is_link(item)) {
      url = item
      type = "link"
    } else {
      text.push(item)
    }
  }

  return {
    type: type,
    url: url,
    text: text.join(" ")
  }
}

// Start here
CF.main()