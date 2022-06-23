const fs = require("fs")

// Main object that holds everything
const CF = {}

// Main function
CF.main = function () {
  CF.get_args()
  CF.process()
}

// Get input and output paths
CF.get_args = function () {
  CF.input = process.argv.slice(2)[0]
  CF.output = process.argv.slice(2)[1]
  
  if (!CF.input || !CF.output) {
    return
  }

  CF.input = fs.readFileSync(CF.input, "utf-8")
}

// Main processing function
CF.process = function () {
  // Get lines and remove multiple linebreaks
  let lines = CF.input.split("\n").map(x => x.trim()).filter(x => x !== "")
  
  let sections = CF.get_sections(lines)
  let markdown = CF.generate_markdown(sections)

  CF.save_file(CF.output, markdown)
}

// Get sections of different types
// Like title, single, list
CF.get_sections = function (lines) {
  let sections = []
  let level = 0
  let current_section

  for (let line of lines) {
    if (level === 0) {
      if (line.endsWith("{")) {
        let section = {type: "list", text: line.replace("{", "").trim(), items: []}
        sections.push(section)
        current_section = section
        level = 1
      } else if (CF.all_caps(line)) {
        sections.push({type: "title", text: line})
      } else if (CF.is_image(line)) {
        let split = line.split(" ").map(x => x.trim())
        sections.push({type: "image", url: split[0]})
      } else if (CF.is_link(line)) {
        let split = line.split(" ").map(x => x.trim())
        let text = split.slice(1).join(" ")
        sections.push({type: "link", url: split[0], text: text})
      } else {
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
      md += `### ${section.text}\n\n`
      
      for (let item of section.items) {
        md += `* ${item}\n`
      }
  
      md += "\n---\n\n"
    } else if (section.type === "single") {
      md += `### ${section.text}\n\n---\n\n`
    } else if (section.type === "title") {
      md += `## ${CF.capitalize(section.text)}\n\n---\n\n`
    } else if (section.type === "image") {
      md += `![](${section.url})\n\n---\n\n`
    } else if (section.type === "link") {
      md += `[${section.text}](${section.url})\n\n---\n\n`
    }
  }

  return md
}

// Save a file to a path
CF.save_file = function (path, data) {
  fs.writeFileSync(path, data, "utf-8")
}

// Util: Check if a text only has capital letters
CF.all_caps = function (s) {
  return !s.split("").some(x => x.toUpperCase() !== x)
}

// Util: Capitalize all the words in a string
CF.capitalize = function (s) {
  let ns = s.toLowerCase()
    .split(" ")
    .map((s) => s.charAt(0).toUpperCase() + s.substring(1))
    .join(" ")

  return ns
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

// Start here
CF.main()