// Central, explicit icon map. Named imports (not `import * as` from lucide-react) so the
// bundler can tree-shake — a wildcard import pulls in every icon in the library (~1MB+).
import {
  Layers,
  BarChart3,
  Handshake,
  UserPlus,
  Code2,
  Puzzle,
  BrainCircuit,
  Cloud,
  Award,
  MapPin,
  Cpu,
  Search,
  PenTool,
  Terminal,
  Rocket,
} from 'lucide-react'

export const iconMap = {
  Layers,
  BarChart3,
  Handshake,
  UserPlus,
  Code2,
  Puzzle,
  BrainCircuit,
  Cloud,
  Award,
  MapPin,
  Cpu,
  Search,
  PenTool,
  Terminal,
  Rocket,
}
