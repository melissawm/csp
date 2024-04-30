#!/bin/bash

# Transform relative links ending in .md into GitHub wiki-style links
collect_files() {
    # Loop through all files and directories in the given folder
    for file in "$1"/*; do
        if [[ -d "$file" ]]; then
            # If it's a directory, recursively call the function
            collect_files "$file"
        elif [[ -f "$file" ]]; then
            # If it's a file, transform links
            if [[ "$file" == *.md ]]; then
                echo "Transforming links in $file"
                sed -i "s/(.*\/\(.*\)\.md/(\1/g" "$file"
            fi
        fi
    done
}

collect_files docs/wiki
echo "Links transformed successfully!"
